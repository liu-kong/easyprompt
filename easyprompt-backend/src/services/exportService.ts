import { Prompt, PromptTable } from '../models';
import { LowDbManager } from '../database/lowdb-manager';

export class ExportService {
  private dbManager: LowDbManager;

  constructor() {
    this.dbManager = LowDbManager.getInstance();
  }

  async exportTableStructure(tableName: string, dbConfigName: string, dbName: string): Promise<string> {
    // Since we're using lowdb, we don't have actual table structure info
    // This is a simplified version that exports a basic structure
    let sql = `-- Table structure for ${tableName}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  code TEXT NOT NULL,\n`;
    sql += `  title TEXT NOT NULL,\n`;
    sql += `  content TEXT NOT NULL,\n`;
    sql += `  version TEXT NOT NULL,\n`;
    sql += `  tags TEXT,\n`;
    sql += `  is_active INTEGER NOT NULL DEFAULT 1,\n`;
    sql += `  is_deleted INTEGER NOT NULL DEFAULT 0,\n`;
    sql += `  created_at TEXT NOT NULL,\n`;
    sql += `  updated_at TEXT NOT NULL\n`;
    sql += `);\n\n`;

    return sql;
  }

  async exportPromptsAsSQL(tableId: string, operation: 'INSERT' | 'UPDATE' = 'INSERT'): Promise<string> {
    const db = this.dbManager.getDb();
    const tableInfo = db.data?.promptTables.find(t => t.id === tableId && !t.is_deleted);
    if (!tableInfo) {
      throw new Error('Table not found');
    }

    const prompts = db.data?.prompts.filter(p => p.table_id === tableId && !p.is_deleted) || [];
    const tableName = tableInfo.table_name;

    let sql = `-- SQL export for table: ${tableName}\n`;
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    if (operation === 'INSERT') {
      sql += `-- INSERT statements for prompts\n`;
      for (const prompt of prompts) {
        const escapedContent = this.escapeSql(prompt.content);
        const escapedTitle = this.escapeSql(prompt.title);
        const escapedTags = prompt.tags ? this.escapeSql(prompt.tags) : 'NULL';
        
        sql += `INSERT INTO ${tableName} (id, code, title, content, version, tags, is_active, is_deleted, created_at, updated_at) VALUES (\n`;
        sql += `  '${prompt.id}',\n`;
        sql += `  '${prompt.code}',\n`;
        sql += `  '${escapedTitle}',\n`;
        sql += `  '${escapedContent}',\n`;
        sql += `  '${prompt.version}',\n`;
        sql += `  ${escapedTags},\n`;
        sql += `  ${prompt.is_active ? 1 : 0},\n`;
        sql += `  0,\n`;
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
        sql += `WHERE id = '${prompt.id}';\n\n`;
      }
    }

    return sql;
  }

  async exportAllTablesAsSQL(projectId: string, operation: 'INSERT' | 'UPDATE' = 'INSERT'): Promise<string> {
    const db = this.dbManager.getDb();
    const tables = db.data?.promptTables.filter(t => t.project_id === projectId && !t.is_deleted) || [];
    let fullSql = `-- Complete SQL export for project ID: ${projectId}\n`;
    fullSql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      fullSql += await this.exportPromptsAsSQL(table.id, operation);
      fullSql += '\n';
    }

    return fullSql;
  }

  async exportTableAsJSON(tableId: string): Promise<any> {
    const db = this.dbManager.getDb();
    const tableInfo = db.data?.promptTables.find(t => t.id === tableId && !t.is_deleted);
    if (!tableInfo) {
      throw new Error('Table not found');
    }

    const prompts = db.data?.prompts.filter(p => p.table_id === tableId && !p.is_deleted) || [];

    return {
      table: tableInfo,
      prompts: prompts,
      exported_at: new Date().toISOString(),
    };
  }

  async exportProjectAsJSON(projectId: string): Promise<any> {
    const db = this.dbManager.getDb();
    const projectInfo = db.data?.projects.find(p => p.id === projectId && !p.is_deleted);
    if (!projectInfo) {
      throw new Error('Project not found');
    }

    const tables = db.data?.promptTables.filter(t => t.project_id === projectId && !t.is_deleted) || [];
    const result: any = {
      project: projectInfo,
      tables: [],
      exported_at: new Date().toISOString(),
    };

    for (const table of tables) {
      const prompts = db.data?.prompts.filter(p => p.table_id === table.id && !p.is_deleted) || [];
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