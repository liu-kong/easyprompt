import { DatabaseConfig } from '../models';

// This file is kept for backward compatibility but is no longer used
// All database operations now use LowDbManager instead

export class DatabaseManager {
  private static instance: DatabaseManager;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // These methods are kept for backward compatibility but should not be used
  // All database operations should use LowDbManager instead
  public async createConnection(config: DatabaseConfig): Promise<any> {
    throw new Error('DatabaseManager is deprecated. Use LowDbManager instead.');
  }

  public getConnection(name: string, database: string): any {
    throw new Error('DatabaseManager is deprecated. Use LowDbManager instead.');
  }

  public async removeConnection(name: string, database: string): Promise<void> {
    throw new Error('DatabaseManager is deprecated. Use LowDbManager instead.');
  }

  public async closeAllConnections(): Promise<void> {
    throw new Error('DatabaseManager is deprecated. Use LowDbManager instead.');
  }

  public async testConnection(config: DatabaseConfig): Promise<boolean> {
    throw new Error('DatabaseManager is deprecated. Use LowDbManager instead.');
  }
}