import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';

interface Data {
  projects: any[];
  prompts: any[];
  promptTables: any[];
  promptVersions: any[];
  databaseConfigs: any[];
  exports: any[];
  repositoryCategories: any[];
  repositoryPrompts: any[];
  aiModels: any[];
}

export class LowDbManager {
  private static instance: LowDbManager;
  private db: Low<Data>;

  private constructor() {
    const file = path.join(__dirname, '../../data.json');
    const adapter = new JSONFile<Data>(file);
    this.db = new Low<Data>(adapter, { projects: [], prompts: [], promptTables: [], promptVersions: [], databaseConfigs: [], exports: [], repositoryCategories: [], repositoryPrompts: [], aiModels: [] });
  }

  public static getInstance(): LowDbManager {
    if (!LowDbManager.instance) {
      LowDbManager.instance = new LowDbManager();
    }
    return LowDbManager.instance;
  }

  public async init(): Promise<void> {
    await this.db.read();
    if (!this.db.data) {
      this.db.data = { projects: [], prompts: [], promptTables: [], promptVersions: [], databaseConfigs: [], exports: [], repositoryCategories: [], repositoryPrompts: [], aiModels: [] };
      await this.db.write();
    }
  }

  public getDb(): Low<Data> {
    return this.db;
  }

  public async save(): Promise<void> {
    await this.db.write();
  }

  public async get(key: keyof Data): Promise<any[]> {
    await this.db.read();
    return this.db.data?.[key] || [];
  }

  public async set(key: keyof Data, value: any[]): Promise<void> {
    await this.db.read();
    if (!this.db.data) {
      this.db.data = { projects: [], prompts: [], promptTables: [], promptVersions: [], databaseConfigs: [], exports: [], repositoryCategories: [], repositoryPrompts: [], aiModels: [] };
    }
    this.db.data[key] = value;
    await this.db.write();
  }
}