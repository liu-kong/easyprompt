import knex, { Knex } from 'knex';
import { DatabaseConfig } from '../models';

export class DatabaseManager {
  private static instance: DatabaseManager;
  public connections: Map<string, Knex> = new Map();

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async createConnection(config: DatabaseConfig): Promise<Knex> {
    const connectionKey = `${config.name}_${config.database}`;
    
    if (this.connections.has(connectionKey)) {
      return this.connections.get(connectionKey)!;
    }

    let knexConfig: Knex.Config;

    switch (config.type) {
      case 'mysql':
        knexConfig = {
          client: 'mysql2',
          connection: {
            host: config.host,
            port: config.port || 3306,
            user: config.username,
            password: config.password,
            database: config.database,
          },
        };
        break;
      case 'postgresql':
        knexConfig = {
          client: 'pg',
          connection: {
            host: config.host,
            port: config.port || 5432,
            user: config.username,
            password: config.password,
            database: config.database,
          },
        };
        break;
      case 'sqlite':
        knexConfig = {
          client: 'better-sqlite3',
          connection: {
            filename: config.filename || config.database,
          },
          useNullAsDefault: true,
        };
        break;
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }

    const connection = knex(knexConfig);
    this.connections.set(connectionKey, connection);
    
    return connection;
  }

  public getConnection(name: string, database: string): Knex | undefined {
    const connectionKey = `${name}_${database}`;
    return this.connections.get(connectionKey);
  }

  public async removeConnection(name: string, database: string): Promise<void> {
    const connectionKey = `${name}_${database}`;
    const connection = this.connections.get(connectionKey);
    if (connection) {
      await connection.destroy();
      this.connections.delete(connectionKey);
    }
  }

  public async closeAllConnections(): Promise<void> {
    for (const [key, connection] of this.connections) {
      await connection.destroy();
    }
    this.connections.clear();
  }

  public async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      const connection = await this.createConnection(config);
      await connection.raw('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}