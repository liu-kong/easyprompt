import { Request, Response } from 'express';
import { DatabaseManager } from '../database/connection';
import { DatabaseConfig } from '../models';
import { generateSnowflakeId } from '../utils/snowflake';

const dbManager = DatabaseManager.getInstance();

// 获取所有数据库配置
export const getDatabaseConfigs = async (req: Request, res: Response) => {
  try {
    // 这里应该从数据库中获取配置，但为了简化，我们先返回一个示例配置
    // 在实际应用中，这些配置应该存储在主数据库中
    const configs: DatabaseConfig[] = [
      {
        id: '1',
        name: '默认SQLite',
        type: 'sqlite',
        database: 'easyprompt.db',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// 创建数据库配置
export const createDatabaseConfig = async (req: Request, res: Response) => {
  try {
    const config: DatabaseConfig = {
      id: generateSnowflakeId(),
      ...req.body,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // 验证必填字段
    if (!config.name || !config.type || !config.database) {
      return res.status(400).json({ error: '名称、类型和数据库为必填字段' });
    }
    
    // 对于MySQL和PostgreSQL，需要验证连接参数
    if ((config.type === 'mysql' || config.type === 'postgresql') && 
        (!config.host || !config.username || !config.password)) {
      return res.status(400).json({ error: 'MySQL和PostgreSQL需要主机、用户名和密码' });
    }
    
    // 测试连接
    const connectionTest = await dbManager.testConnection(config);
    if (!connectionTest) {
      return res.status(400).json({ error: '数据库连接测试失败' });
    }
    
    // 在实际应用中，这里应该将配置保存到数据库
    // 为了简化，我们只是返回成功响应
    
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// 更新数据库配置
export const updateDatabaseConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // 在实际应用中，这里应该从数据库中获取并更新配置
    // 为了简化，我们只是返回成功响应
    
    const updatedConfig: DatabaseConfig = {
      id,
      ...updates,
      is_deleted: false,
      updated_at: new Date()
    };
    
    // 测试连接
    const connectionTest = await dbManager.testConnection(updatedConfig);
    if (!connectionTest) {
      return res.status(400).json({ error: '数据库连接测试失败' });
    }
    
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// 删除数据库配置
export const deleteDatabaseConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 在实际应用中，这里应该从数据库中删除配置
    // 为了简化，我们只是返回成功响应
    
    // 关闭相关连接
    const config = { id, name: '', type: 'sqlite' as const, database: '' };
    await dbManager.removeConnection(config.name, config.database);
    
    res.json({ message: '数据库配置已删除' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// 测试数据库连接
export const testDatabaseConnection = async (req: Request, res: Response) => {
  try {
    const config: DatabaseConfig = req.body;
    
    // 验证必填字段
    if (!config.type || !config.database) {
      return res.status(400).json({ error: '类型和数据库为必填字段' });
    }
    
    // 对于MySQL和PostgreSQL，需要验证连接参数
    if ((config.type === 'mysql' || config.type === 'postgresql') && 
        (!config.host || !config.username || !config.password)) {
      return res.status(400).json({ error: 'MySQL和PostgreSQL需要主机、用户名和密码' });
    }
    
    const connectionTest = await dbManager.testConnection(config);
    
    if (connectionTest) {
      res.json({ success: true, message: '数据库连接成功' });
    } else {
      res.status(400).json({ success: false, message: '数据库连接失败' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// 获取数据库表列表
export const getDatabaseTables = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 在实际应用中，这里应该从数据库中获取配置
    // 为了简化，我们使用一个示例配置
    const config: DatabaseConfig = {
      id,
      name: '示例数据库',
      type: 'sqlite',
      database: 'easyprompt.db',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
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
    
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};