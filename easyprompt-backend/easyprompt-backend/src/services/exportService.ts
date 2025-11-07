import { Knex } from 'knex';
import { Prompt, PromptTable } from '../models';
import { DatabaseManager } from '../database/connection';

export class ExportService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async exportTableStructure(tableName: string, dbConfigName: string, dbName: string): Promise<string> {
    const connection = this.dbManager.getConnection(dbConfigName, dbName);
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const tableInfo = await connection(tableName).columnInfo();
    const columns = Object.keys(tableInfo);

    let sql = `-- Table structure for ${tableName}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    sql += `  id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;

    for (const column of columns) {
      if (column !== 'id') {
        const info = tableInfo[column];
        const type = this.mapColumnType(info.type);
        const nullable = info.nullable ? '' : ' NOT NULL';
        const defaultValue = info.defaultValue ? ` DEFAULT ${info.defaultValue}` : '';
        sql += `  ${column} ${type}${nullable}${defaultValue},\n`;
      }
    }

    sql = sql.replace(/,\n$/, '\n'); // 移除最后的逗号
    sql += `);\n\n`;

    return sql;
  }

  async exportPromptsAsSQL(tableId: number, operation: 'INSERT' | 'UPDATE' = 'INSERT'): Promise<string> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const tableInfo = await connection('prompt_tables').where('id', tableId).first();
    if (!tableInfo) {
      throw new Error('Table not found');
    }

    const prompts = await connection('prompts').where('table_id', tableId);
    const tableName = tableInfo.table_name;

    let sql = `-- SQL export for table: ${tableName}\n`;
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    if (operation === 'INSERT') {
      sql += `-- INSERT statements for prompts\n`;
      for (const prompt of prompts) {
        const escapedContent = this.escapeSql(prompt.content);
        const escapedTitle = this.escapeSql(prompt.title);
        const escapedTags = prompt.tags ? this.escapeSql(prompt.tags) : 'NULL';
        
        sql += `INSERT INTO ${tableName} (code, title, content, version, tags, is_active, created_at, updated_at) VALUES (\n`;
        sql += `  '${prompt.code}',\n`;
        sql += `  '${escapedTitle}',\n`;
        sql += `  '${escapedContent}',\n`;
        sql += `  '${prompt.version}',\n`;
        sql += `  ${escapedTags},\n`;
        sql += `  ${prompt.is_active ? 1 : 0},\n`;
        sql += `  '${prompt.created_at.toISOString()}',\n`;
        sql += `  '${prompt.updated_at.toISOString()}'\n`;
        sql += `);\n\n`;
      }
    } else {
      sql += `-- UPDATE statements for prompts\n`;
      for (const prompt of prompts) {
        const escapedContent = this.escapeSql(prompt.content);
        const escapedTitle = this.escapeSql(prompt.title);
        const escapedTags = prompt.tags ? `'${this.escapeSql(prompt.tags)}'` : 'NULL';
        
        sql += `UPDATE ${tableName} SET\n`;
        sql += `  title = '${escapedTitle}',\n`;
        sql += `  content = '${escapedContent}',\n`;
        sql += `  version = '${prompt.version}',\n`;
        sql += `  tags = ${escapedTags},\n`;
        sql += `  is_active = ${prompt.is_active ? 1 : 0},\n`;
        sql += `  updated_at = '${new Date().toISOString()}'\n`;
        sql += `WHERE code = '${prompt.code}';\n\n`;
      }
    }

    return sql;
  }

  async exportAllTablesAsSQL(projectId: number, operation: 'INSERT' | 'UPDATE' = 'INSERT'): Promise<string> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const tables = await connection('prompt_tables').where('project_id', projectId);
    let fullSql = `-- Complete SQL export for project ID: ${projectId}\n`;
    fullSql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      fullSql += await this.exportPromptsAsSQL(table.id, operation);
      fullSql += '\n';
    }

    return fullSql;
  }

  async exportTableAsJSON(tableId: number): Promise<any> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const tableInfo = await connection('prompt_tables').where('id', tableId).first();
    if (!tableInfo) {
      throw new Error('Table not found');
    }

    const prompts = await connection('prompts').where('table_id', tableId);

    return {
      table: tableInfo,
      prompts: prompts,
      exported_at: new Date().toISOString(),
    };
  }

  async exportProjectAsJSON(projectId: number): Promise<any> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const projectInfo = await connection('projects').where('id', projectId).first();
    if (!projectInfo) {
      throw new Error('Project not found');
    }

    const tables = await connection('prompt_tables').where('project_id', projectId);
    const result: any = {
      project: projectInfo,
      tables: [],
      exported_at: new Date().toISOString(),
    };

    for (const table of tables) {
      const prompts = await connection('prompts').where('table_id', table.id);
      result.tables.push({
        table: table,
        prompts: prompts,
      });
    }

    return result;
  }

  private mapColumnType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'int': 'INTEGER',
      'integer': 'INTEGER',
      'varchar': 'TEXT',
      'text': 'TEXT',
      'boolean': 'INTEGER',
      'datetime': 'TEXT',
      'timestamp': 'TEXT',
    };

    const lowerType = type.toLowerCase();
    for (const [key, value] of Object.entries(typeMap)) {
      if (lowerType.includes(key)) {
        return value;
      }
    }

    return 'TEXT';
  }

  private escapeSql(value: string): string {
    return value.replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }
}