import { DatabaseConfig } from '../models';
import { DatabaseManager } from '../database/connection';
import { generateSnowflakeId } from '../utils/snowflake';

const dbManager = DatabaseManager.getInstance();

export class DatabaseConfigService {
  private connection: any;

  constructor() {
    // 使用默认数据库连接
    this.connection = dbManager.getConnection('default', 'easyprompt.db');
    if (!this.connection) {
      throw new Error('Default database connection not found. Please ensure the application is properly initialized.');
    }
  }

  // 初始化方法，用于异步设置连接
  async initialize(): Promise<void> {
    if (!this.connection) {
      // 如果默认连接不存在，尝试创建一个
      console.warn('Default database connection not found, attempting to create one');
      try {
        const defaultConfig = {
          id: 'default',
          name: 'default',
          type: 'sqlite' as const,
          database: 'easyprompt.db',
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date(),
        };
        this.connection = await dbManager.createConnection(defaultConfig);
        if (!this.connection) {
          throw new Error('Failed to create default database connection');
        }
      } catch (error) {
        throw new Error(`Default database connection not found: ${(error as Error).message}`);
      }
    }
  }

  // 获取所有数据库配置
  async getAllDatabaseConfigs(): Promise<DatabaseConfig[]> {
    try {
      const configs = await this.connection('database_configs')
        .select('*')
        .where('is_deleted', false)
        .orderBy('created_at', 'desc');
      
      return configs.map((config: any) => ({
        ...config,
        created_at: new Date(config.created_at).toISOString(),
        updated_at: new Date(config.updated_at).toISOString()
      }));
    } catch (error) {
      console.error('Error fetching database configs:', error);
      throw error;
    }
  }

  // 根据ID获取数据库配置
  async getDatabaseConfigById(id: string): Promise<DatabaseConfig | null> {
    try {
      const config = await this.connection('database_configs')
        .select('*')
        .where({ id, is_deleted: false })
        .first();
      
      if (!config) return null;
      
      return {
        ...config,
        created_at: new Date(config.created_at).toISOString(),
        updated_at: new Date(config.updated_at).toISOString()
      };
    } catch (error) {
      console.error('Error fetching database config by ID:', error);
      throw error;
    }
  }

  // 创建数据库配置
  async createDatabaseConfig(configData: Omit<DatabaseConfig, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>): Promise<DatabaseConfig> {
    try {
      const id = generateSnowflakeId();
      const now = new Date();
      
      const [newConfig] = await this.connection('database_configs')
        .insert({
          id,
          ...configData,
          is_deleted: false,
          created_at: now,
          updated_at: now
        })
        .returning('*');
      
      return {
        ...newConfig,
        created_at: new Date(newConfig.created_at).toISOString(),
        updated_at: new Date(newConfig.updated_at).toISOString()
      };
    } catch (error) {
      console.error('Error creating database config:', error);
      throw error;
    }
  }

  // 更新数据库配置
  async updateDatabaseConfig(id: string, updates: Partial<Omit<DatabaseConfig, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>>): Promise<DatabaseConfig> {
    try {
      const now = new Date();
      
      const [updatedConfig] = await this.connection('database_configs')
        .where({ id, is_deleted: false })
        .update({
          ...updates,
          updated_at: now
        })
        .returning('*');
      
      if (!updatedConfig) {
        throw new Error('Database config not found');
      }
      
      return {
        ...updatedConfig,
        created_at: new Date(updatedConfig.created_at).toISOString(),
        updated_at: new Date(updatedConfig.updated_at).toISOString()
      };
    } catch (error) {
      console.error('Error updating database config:', error);
      throw error;
    }
  }

  // 删除数据库配置（逻辑删除）
  async deleteDatabaseConfig(id: string): Promise<void> {
    try {
      await this.connection('database_configs')
        .where({ id })
        .update({
          is_deleted: true,
          updated_at: new Date()
        });
      
      // 关闭相关连接
      const config = await this.getDatabaseConfigById(id);
      if (config) {
        await dbManager.removeConnection(config.name, config.database);
      }
    } catch (error) {
      console.error('Error deleting database config:', error);
      throw error;
    }
  }

  // 测试数据库连接
  async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      return await dbManager.testConnection(config);
    } catch (error) {
      console.error('Error testing database connection:', error);
      return false;
    }
  }

  // 获取远程数据库表列表
  async getRemoteTableList(configId: string): Promise<string[]> {
    try {
      const config = await this.getDatabaseConfigById(configId);
      if (!config) {
        throw new Error('Database config not found');
      }
      
      const connection = await dbManager.createConnection(config);
      
      let tables: string[] = [];
      
      if (config.type === 'sqlite') {
        const result = await connection.raw("SELECT name FROM sqlite_master WHERE type='table'");
        tables = result.map((row: any) => row.name);
      } else if (config.type === 'mysql') {
        const result = await connection.raw('SHOW TABLES');
        tables = result.map((row: any) => Object.values(row)[0] as string);
      } else if (config.type === 'postgresql') {
        const result = await connection.raw(
          "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'"
        );
        tables = result.map((row: any) => row.tablename);
      }
      
      return tables;
    } catch (error) {
      console.error('Error getting remote table list:', error);
      throw error;
    }
  }

  // 获取远程数据库表结构
  async getRemoteTableSchema(configId: string, tableName: string): Promise<any[]> {
    try {
      const config = await this.getDatabaseConfigById(configId);
      if (!config) {
        throw new Error('Database config not found');
      }
      
      const connection = await dbManager.createConnection(config);
      
      let schema: any[] = [];
      
      if (config.type === 'sqlite') {
        const result = await connection.raw(`PRAGMA table_info(${tableName})`);
        schema = result.map((row: any) => ({
          name: row.name,
          type: row.type,
          nullable: row.notnull === 0,
          default: row.dflt_value,
          primary_key: row.pk === 1
        }));
      } else if (config.type === 'mysql') {
        const result = await connection.raw(`DESCRIBE ${tableName}`);
        schema = result.map((row: any) => ({
          name: row.Field,
          type: row.Type,
          nullable: row.Null === 'YES',
          default: row.Default,
          primary_key: row.Key === 'PRI'
        }));
      } else if (config.type === 'postgresql') {
        const result = await connection.raw(`
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
        `);
        schema = result.map((row: any) => ({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
          default: row.column_default,
          primary_key: false // 需要额外查询主键信息
        }));
      }
      
      return schema;
    } catch (error) {
      console.error('Error getting remote table schema:', error);
      throw error;
    }
  }

  // 查询远程数据库表
  async queryRemoteTable(configId: string, tableName: string, limit: number = 100, offset: number = 0): Promise<any[]> {
    try {
      const config = await this.getDatabaseConfigById(configId);
      if (!config) {
        throw new Error('Database config not found');
      }
      
      const connection = await dbManager.createConnection(config);
      
      const result = await connection(tableName)
        .select('*')
        .limit(limit)
        .offset(offset);
      
      return result;
    } catch (error) {
      console.error('Error querying remote table:', error);
      throw error;
    }
  }
}