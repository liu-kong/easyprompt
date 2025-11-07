import { Request, Response } from 'express';
import { DatabaseConfigService } from '../services/databaseConfigService';
import { DatabaseConfig } from '../models';

let databaseConfigService: DatabaseConfigService | null = null;

// 获取数据库配置服务实例
const getDatabaseConfigService = async (): Promise<DatabaseConfigService> => {
  if (!databaseConfigService) {
    databaseConfigService = new DatabaseConfigService();
    await databaseConfigService.initialize();
  }
  return databaseConfigService;
};

export class DatabaseConfigController {
  // 获取所有数据库配置
  async getDatabaseConfigs(req: Request, res: Response) {
    try {
      const service = await getDatabaseConfigService();
      const configs = await service.getAllDatabaseConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // 根据ID获取数据库配置
  async getDatabaseConfigById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = await getDatabaseConfigService();
      const config = await service.getDatabaseConfigById(id);
      
      if (!config) {
        return res.status(404).json({ error: '数据库配置不存在' });
      }
      
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // 创建数据库配置
  async createDatabaseConfig(req: Request, res: Response) {
    try {
      const configData = req.body;
      
      // 验证必填字段
      if (!configData.name || !configData.type || !configData.database) {
        return res.status(400).json({ error: '名称、类型和数据库为必填字段' });
      }
      
      // 对于MySQL和PostgreSQL，需要验证连接参数
      if ((configData.type === 'mysql' || configData.type === 'postgresql') &&
          (!configData.host || !configData.username || !configData.password)) {
        return res.status(400).json({ error: 'MySQL和PostgreSQL需要主机、用户名和密码' });
      }
      
      const service = await getDatabaseConfigService();
      // 测试连接
      const connectionTest = await service.testConnection(configData);
      if (!connectionTest) {
        return res.status(400).json({ error: '数据库连接测试失败' });
      }
      
      const config = await service.createDatabaseConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // 更新数据库配置
  async updateDatabaseConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const service = await getDatabaseConfigService();
      // 测试连接
      const updatedConfig = { ...updates, id } as DatabaseConfig;
      const connectionTest = await service.testConnection(updatedConfig);
      if (!connectionTest) {
        return res.status(400).json({ error: '数据库连接测试失败' });
      }
      
      const config = await service.updateDatabaseConfig(id, updates);
      
      if (!config) {
        return res.status(404).json({ error: '数据库配置不存在' });
      }
      
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // 删除数据库配置
  async deleteDatabaseConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = await getDatabaseConfigService();
      await service.deleteDatabaseConfig(id);
      res.json({ message: '数据库配置已删除' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // 测试数据库连接
  async testDatabaseConnection(req: Request, res: Response) {
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
      
      const service = await getDatabaseConfigService();
      const connectionTest = await service.testConnection(config);
      
      if (connectionTest) {
        res.json({ success: true, message: '数据库连接成功' });
      } else {
        res.status(400).json({ success: false, message: '数据库连接失败' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  // 获取远程数据库表列表
  async getRemoteTableList(req: Request, res: Response) {
    try {
      const { configId } = req.params;
      const service = await getDatabaseConfigService();
      const tables = await service.getRemoteTableList(configId);
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // 获取远程数据库表结构
  async getRemoteTableSchema(req: Request, res: Response) {
    try {
      const { configId, tableName } = req.params;
      const service = await getDatabaseConfigService();
      const schema = await service.getRemoteTableSchema(configId, tableName);
      res.json(schema);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // 查询远程数据库表
  async queryRemoteTable(req: Request, res: Response) {
    try {
      const { configId, tableName } = req.params;
      const { limit = 100, offset = 0 } = req.query;
      const service = await getDatabaseConfigService();
      const result = await service.queryRemoteTable(configId, tableName, Number(limit), Number(offset));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}