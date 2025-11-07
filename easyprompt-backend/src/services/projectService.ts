import { Knex } from 'knex';
import { Project, PromptTable } from '../models';
import { DatabaseManager } from '../database/connection';
import { generateSnowflakeId } from '../utils/snowflake';

export class ProjectService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const [project] = await connection('projects')
      .insert({
        id: generateSnowflakeId(),
        name: projectData.name,
        description: projectData.description,
        is_deleted: false,
      })
      .returning('*');

    return project;
  }

  async getProjects(): Promise<Project[]> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    return await connection('projects').where('is_deleted', false).select('*');
  }

  async getProjectById(id: string): Promise<Project | null> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const project = await connection('projects').where('id', id).where('is_deleted', false).first();
    return project || null;
  }

  async updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const [project] = await connection('projects')
      .where('id', id)
      .where('is_deleted', false)
      .update({
        ...projectData,
        updated_at: new Date(),
      })
      .returning('*');

    return project || null;
  }

  async deleteProject(id: string): Promise<boolean> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const deletedCount = await connection('projects')
      .where('id', id)
      .where('is_deleted', false)
      .update({
        is_deleted: true,
        updated_at: new Date()
      });
    return deletedCount > 0;
  }

  async createPromptTable(tableData: Omit<PromptTable, 'id' | 'created_at' | 'updated_at'>): Promise<PromptTable> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const [table] = await connection('prompt_tables')
      .insert({
        id: generateSnowflakeId(),
        project_id: tableData.project_id,
        name: tableData.name,
        table_name: tableData.table_name,
        description: tableData.description,
        is_deleted: false,
      })
      .returning('*');

    return table;
  }

  async getPromptTables(projectId: string): Promise<PromptTable[]> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    return await connection('prompt_tables')
      .where('project_id', projectId)
      .where('is_deleted', false)
      .select('*');
  }

  async getPromptTableById(id: string): Promise<PromptTable | null> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const table = await connection('prompt_tables')
      .where('id', id)
      .where('is_deleted', false)
      .first();
    return table || null;
  }

  async updatePromptTable(id: string, tableData: Partial<PromptTable>): Promise<PromptTable | null> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const [table] = await connection('prompt_tables')
      .where('id', id)
      .where('is_deleted', false)
      .update({
        ...tableData,
        updated_at: new Date(),
      })
      .returning('*');

    return table || null;
  }

  async deletePromptTable(id: string): Promise<boolean> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const deletedCount = await connection('prompt_tables')
      .where('id', id)
      .where('is_deleted', false)
      .update({
        is_deleted: true,
        updated_at: new Date()
      });
    return deletedCount > 0;
  }
}