import { Project, PromptTable } from '../models';
import { LowDbManager } from '../database/lowdb-manager';
import { generateSnowflakeId } from '../utils/snowflake';

export class ProjectService {
  private dbManager: LowDbManager;

  constructor() {
    this.dbManager = LowDbManager.getInstance();
  }

  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const db = this.dbManager.getDb();
    const project: Project = {
      id: generateSnowflakeId(),
      name: projectData.name,
      description: projectData.description,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    db.data?.projects.push(project);
    await this.dbManager.save();

    return project;
  }

  async getProjects(): Promise<Project[]> {
    const db = this.dbManager.getDb();
    return db.data?.projects.filter(p => !p.is_deleted) || [];
  }

  async getProjectById(id: string): Promise<Project | null> {
    const db = this.dbManager.getDb();
    const project = db.data?.projects.find(p => p.id === id && !p.is_deleted);
    return project || null;
  }

  async updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
    const db = this.dbManager.getDb();
    const projectIndex = db.data?.projects.findIndex(p => p.id === id && !p.is_deleted);
    
    if (projectIndex === undefined || projectIndex === -1) {
      return null;
    }

    const updatedProject = {
      ...db.data!.projects[projectIndex],
      ...projectData,
      updated_at: new Date(),
    };

    db.data!.projects[projectIndex] = updatedProject;
    await this.dbManager.save();

    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    const db = this.dbManager.getDb();
    const projectIndex = db.data?.projects.findIndex(p => p.id === id && !p.is_deleted);
    
    if (projectIndex === undefined || projectIndex === -1) {
      return false;
    }

    db.data!.projects[projectIndex].is_deleted = true;
    db.data!.projects[projectIndex].updated_at = new Date();
    await this.dbManager.save();

    return true;
  }

  async createPromptTable(tableData: Omit<PromptTable, 'id' | 'created_at' | 'updated_at'>): Promise<PromptTable> {
    const db = this.dbManager.getDb();
    const table: PromptTable = {
      id: generateSnowflakeId(),
      project_id: tableData.project_id,
      name: tableData.name,
      table_name: tableData.table_name,
      description: tableData.description,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    db.data?.promptTables.push(table);
    await this.dbManager.save();

    return table;
  }

  async getPromptTables(projectId: string): Promise<PromptTable[]> {
    const db = this.dbManager.getDb();
    return db.data?.promptTables.filter(t => t.project_id === projectId && !t.is_deleted) || [];
  }

  async getPromptTableById(id: string): Promise<PromptTable | null> {
    const db = this.dbManager.getDb();
    const table = db.data?.promptTables.find(t => t.id === id && !t.is_deleted);
    return table || null;
  }

  async updatePromptTable(id: string, tableData: Partial<PromptTable>): Promise<PromptTable | null> {
    const db = this.dbManager.getDb();
    const tableIndex = db.data?.promptTables.findIndex(t => t.id === id && !t.is_deleted);
    
    if (tableIndex === undefined || tableIndex === -1) {
      return null;
    }

    const updatedTable = {
      ...db.data!.promptTables[tableIndex],
      ...tableData,
      updated_at: new Date(),
    };

    db.data!.promptTables[tableIndex] = updatedTable;
    await this.dbManager.save();

    return updatedTable;
  }

  async deletePromptTable(id: string): Promise<boolean> {
    const db = this.dbManager.getDb();
    const tableIndex = db.data?.promptTables.findIndex(t => t.id === id && !t.is_deleted);
    
    if (tableIndex === undefined || tableIndex === -1) {
      return false;
    }

    db.data!.promptTables[tableIndex].is_deleted = true;
    db.data!.promptTables[tableIndex].updated_at = new Date();
    await this.dbManager.save();

    return true;
  }
}