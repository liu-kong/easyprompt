# EasyPrompt 数据持久化方案

## 概述

EasyPrompt 项目采用多层数据持久化架构，支持多种数据库类型，并提供灵活的配置管理。本文档详细说明了项目的数据持久化方案。

## 架构设计

### 1. 主数据库

项目使用一个主数据库来存储应用程序的核心数据，包括：
- 项目信息
- 提示词表配置
- 数据库连接配置
- 用户信息（如果添加认证功能）

默认情况下，项目使用 SQLite 作为主数据库，但可以通过配置切换到 MySQL 或 PostgreSQL。

### 2. 动态数据库连接

EasyPrompt 支持连接到多个外部数据库，用于存储和管理不同项目的提示词数据。这种设计允许：
- 为不同项目使用不同的数据库
- 连接到现有的数据库系统
- 支持远程数据库连接

## 数据库支持

### SQLite
- **用途**: 默认主数据库，适合小型部署和开发环境
- **特点**: 
  - 无需额外服务器
  - 文件型数据库
  - 适合单用户场景
- **配置**: 只需指定数据库文件路径

### MySQL
- **用途**: 生产环境，多用户场景
- **特点**:
  - 高性能
  - 支持并发访问
  - 适合大型部署
- **配置**: 需要主机、端口、用户名、密码和数据库名

### PostgreSQL
- **用途**: 企业级部署，需要高级功能
- **特点**:
  - 强大的查询功能
  - 支持复杂事务
  - 丰富的数据类型
- **配置**: 需要主机、端口、用户名、密码和数据库名

## 数据模型

### 核心实体

1. **项目 (Projects)**
   - 存储项目基本信息
   - 包含项目名称、描述等

2. **提示词表 (PromptTables)**
   - 存储提示词表的配置信息
   - 关联到项目

3. **提示词 (Prompts)**
   - 存储实际的提示词内容
   - 包含版本信息、标签等

4. **提示词版本 (PromptVersions)**
   - 存储提示词的历史版本
   - 支持版本回滚

5. **数据库配置 (DatabaseConfigs)**
   - 存储外部数据库连接配置
   - 支持多种数据库类型

## 连接管理

### DatabaseManager 类

项目使用单例模式的 `DatabaseManager` 类来管理所有数据库连接：

```typescript
class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, Knex> = new Map();
  
  // 创建连接
  public async createConnection(config: DatabaseConfig): Promise<Knex>
  
  // 获取连接
  public getConnection(name: string, database: string): Knex | undefined
  
  // 移除连接
  public async removeConnection(name: string, database: string): Promise<void>
  
  // 测试连接
  public async testConnection(config: DatabaseConfig): Promise<boolean>
}
```

### 连接池

- 每个数据库配置维护独立的连接
- 连接在首次使用时创建
- 支持连接复用
- 应用关闭时自动清理所有连接

## 数据迁移

### 初始化脚本

应用启动时自动执行以下操作：

1. **创建表结构**
   - 检查并创建所有必要的表
   - 建立适当的索引和约束

2. **更新现有表**
   - 检查并添加新字段
   - 处理数据类型变更
   - 保持向后兼容性

### 迁移策略

- 使用版本号跟踪数据库结构
- 支持增量更新
- 提供回滚机制（如果需要）

## 配置管理

### 环境变量

通过 `.env` 文件配置主数据库：

```env
# 数据库类型
DB_TYPE=sqlite

# SQLite 配置
DB_DATABASE=easyprompt.db

# MySQL 配置示例
# DB_TYPE=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_DATABASE=easyprompt
# DB_USERNAME=root
# DB_PASSWORD=password

# PostgreSQL 配置示例
# DB_TYPE=postgresql
# DB_HOST=localhost
# DB_PORT=5432
# DB_DATABASE=easyprompt
# DB_USERNAME=postgres
# DB_PASSWORD=password
```

### 动态配置

通过应用程序界面管理外部数据库连接：

1. **添加配置**
   - 指定连接参数
   - 测试连接有效性
   - 保存配置到主数据库

2. **管理配置**
   - 编辑现有配置
   - 删除不需要的配置
   - 查看连接状态

## 数据安全

### 敏感信息处理

- 数据库密码在传输过程中加密
- 配置信息存储在主数据库中
- 支持环境变量覆盖

### 备份策略

1. **主数据库备份**
   - 定期备份 SQLite 文件
   - 导出 MySQL/PostgreSQL 数据

2. **外部数据备份**
   - 通过导出功能备份提示词数据
   - 支持多种格式（SQL、JSON）

## 性能优化

### 查询优化

- 使用适当的索引
- 实现分页查询
- 优化复杂查询

### 连接优化

- 连接池管理
- 查询缓存
- 延迟连接初始化

## 扩展性

### 水平扩展

- 支持读写分离（如果需要）
- 可以添加缓存层
- 支持数据库分片

### 垂直扩展

- 模块化设计
- 插件架构支持
- API 接口标准化

## 部署考虑

### 开发环境

- 使用 SQLite 简化部署
- 自动初始化数据库
- 提供测试数据

### 生产环境

- 推荐使用 MySQL 或 PostgreSQL
- 配置连接池
- 实施监控和日志

### Docker 部署

- 支持数据卷挂载
- 环境变量配置
- 容器间网络配置

## 故障恢复

### 连接失败处理

- 自动重试机制
- 降级策略
- 错误日志记录

### 数据恢复

- 从备份恢复
- 事务回滚
- 数据一致性检查

## 总结

EasyPrompt 的数据持久化方案提供了：

1. **灵活性**: 支持多种数据库类型
2. **可扩展性**: 模块化设计，易于扩展
3. **可靠性**: 完善的错误处理和恢复机制
4. **易用性**: 简单的配置和管理界面
5. **性能**: 优化的查询和连接管理

这种设计使得 EasyPrompt 能够适应各种部署场景，从个人使用到企业级部署。