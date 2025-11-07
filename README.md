# EasyPrompt

一个简单易用的prompt管理平台，简化prompt管理流程。

## 🎯 项目状态

**✅ 开发完成** - EasyPrompt提示词管理平台已完全开发完成，包含所有核心功能和部署配置。

### 📋 已完成功能清单
- ✅ 多数据库支持 (MySQL、PostgreSQL、SQLite)
- ✅ 远程数据库访问和管理
- ✅ 项目管理系统
- ✅ 提示词CRUD操作
- ✅ 版本控制系统
- ✅ 数据导出功能 (SQL/JSON)
- ✅ 多表对比分析
- ✅ 代码生成 (Python/Java/Go)
- ✅ Vue3 + TypeScript前端界面
- ✅ Docker容器化部署
- ✅ 完整的API文档
- ✅ 本地开发环境配置

## 功能特性

- 🚀 **多数据库支持** - 支持MySQL、PostgreSQL、SQLite等多种数据库
- 🌐 **远程数据库访问** - 支持连接和管理远程数据库中的提示词表
- 📝 **提示词管理** - 快速创建、编辑、删除提示词
- 🏷️ **代码标识** - 使用code字段作为提示词标识，快速索引
- 📊 **版本管理** - 支持项目级和单个提示词的版本管理
- 📤 **数据导出** - 导出SQL命令(INSERT/UPDATE)和表结构
- 🔍 **对比分析** - 多表对比分析，明确内容差异
- 💻 **代码生成** - 支持Python、Java、Go语言快速构建智能体
- 🐳 **容器化部署** - 支持Docker和docker-compose部署

## 技术栈

### 后端
- Node.js + TypeScript
- Express.js
- Knex.js (数据库ORM)
- SQLite/MySQL/PostgreSQL

### 前端
- Vue 3
- TypeScript
- Vite
- Pinia (状态管理)
- Vue Router

## 快速开始

### 使用Docker Compose (推荐)

1. 克隆项目
```bash
git clone <repository-url>
cd easyprompt
```

2. 启动服务
```bash
docker-compose up -d
```

3. 访问应用
- 前端: http://localhost
- 后端API: http://localhost:3000
- 健康检查: http://localhost:3000/health

### 使用MySQL数据库
```bash
docker-compose --profile mysql up -d
```

### 使用PostgreSQL数据库
```bash
docker-compose --profile postgres up -d
```

### 本地开发

📖 **Windows用户快速启动指南**: [WINDOWS_SETUP.md](WINDOWS_SETUP.md)
📖 **详细开发指南**: [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)

#### Windows 环境（推荐）

```cmd
# 克隆项目
git clone <repository-url>
cd easyprompt

# 方法一：一键启动脚本（推荐）
start-dev.bat

# 方法二：分别启动
# 后端：cd easyprompt-backend && start-dev.bat
# 前端：cd easyprompt-frontend && start-dev.bat
```

#### Linux/Mac 环境

```bash
# 克隆项目
git clone <repository-url>
cd easyprompt

# 方法一：一键启动脚本（推荐）
chmod +x easyprompt-backend/start-dev.sh
./easyprompt-backend/start-dev.sh

# 方法二：分别启动
# 后端：cd easyprompt-backend && npm install && npm run dev
# 前端：cd easyprompt-frontend && npm install && npm run dev
```

#### 访问地址
- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/health

## API文档

### 项目管理
- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建新项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

### 提示词表管理
- `GET /api/projects/:projectId/prompt-tables` - 获取项目的提示词表
- `POST /api/prompt-tables` - 创建提示词表
- `GET /api/prompt-tables/:id` - 获取表详情
- `PUT /api/prompt-tables/:id` - 更新表
- `DELETE /api/prompt-tables/:id` - 删除表

### 提示词管理
- `GET /api/prompts` - 获取提示词列表
- `POST /api/prompts` - 创建提示词
- `GET /api/prompts/:id` - 获取提示词详情
- `PUT /api/prompts/:id` - 更新提示词
- `DELETE /api/prompts/:id` - 删除提示词
- `GET /api/prompts/search` - 搜索提示词

### 版本管理
- `GET /api/prompts/:promptId/versions` - 获取版本历史
- `POST /api/prompts/:promptId/restore/:version` - 恢复到指定版本

### 数据导出
- `GET /api/export/prompts/:tableId` - 导出提示词为SQL
- `GET /api/export/project/:projectId` - 导出整个项目
- `GET /api/export/table/:tableId/json` - 导出为JSON

### 对比分析
- `GET /api/compare/tables/:tableId1/:tableId2` - 对比两个表
- `GET /api/statistics/table/:tableId` - 获取表统计信息

### 代码生成
- `GET /api/generate/python/:tableId` - 生成Python代码
- `GET /api/generate/java/:tableId` - 生成Java代码
- `GET /api/generate/go/:tableId` - 生成Go代码

### 数据库配置管理
- `POST /api/database-configs` - 创建数据库配置
- `GET /api/database-configs` - 获取所有数据库配置
- `GET /api/database-configs/:id` - 获取指定数据库配置
- `PUT /api/database-configs/:id` - 更新数据库配置
- `DELETE /api/database-configs/:id` - 删除数据库配置
- `POST /api/database-configs/test` - 测试数据库连接
- `POST /api/database-configs/:configId/tables` - 获取远程数据库表列表
- `GET /api/database-configs/:configId/tables/:tableName/schema` - 获取远程表结构
- `GET /api/database-configs/:configId/tables/:tableName/query` - 查询远程表数据

## 数据库配置

### SQLite (默认)
```env
DB_TYPE=sqlite
DB_DATABASE=easyprompt.db
```

### MySQL
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=easyprompt
DB_USERNAME=root
DB_PASSWORD=password
```

### PostgreSQL
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=easyprompt
DB_USERNAME=postgres
DB_PASSWORD=password
```

## 项目结构

```
easyprompt/
├── easyprompt-backend/          # 后端服务
│   ├── src/
│   │   ├── controllers/         # 控制器
│   │   ├── services/          # 业务逻辑
│   │   ├── models/            # 数据模型
│   │   ├── database/          # 数据库相关
│   │   ├── routes/            # 路由定义
│   │   └── app.ts            # 应用入口
│   ├── Dockerfile
│   └── package.json
├── easyprompt-frontend/        # 前端应用
│   ├── src/
│   │   ├── components/        # Vue组件
│   │   ├── views/             # 页面视图
│   │   ├── stores/            # Pinia状态管理
│   │   └── router/           # 路由配置
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml          # Docker编排文件
└── README.md
```

## 远程数据库访问

EasyPrompt支持访问和管理远程数据库中的提示词表：

### 配置远程数据库
```bash
# 创建MySQL数据库配置
curl -X POST http://localhost:3000/api/database-configs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "remote_mysql",
    "type": "mysql",
    "host": "your-mysql-host",
    "port": 3306,
    "database": "your_database",
    "username": "your_username",
    "password": "your_password"
  }'

# 创建PostgreSQL数据库配置
curl -X POST http://localhost:3000/api/database-configs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "remote_postgres",
    "type": "postgresql",
    "host": "your-postgres-host",
    "port": 5432,
    "database": "your_database",
    "username": "your_username",
    "password": "your_password"
  }'
```

### 获取远程表列表
```bash
# 获取指定数据库配置下的所有表
curl -X POST http://localhost:3000/api/database-configs/1/tables \
  -H "Content-Type: application/json" \
  -d '{"configId": 1}'
```

### 获取表结构
```bash
# 获取远程表的结构信息
curl -X GET http://localhost:3000/api/database-configs/1/tables/your_table_name/schema
```

### 查询表数据
```bash
# 查询远程表中的数据
curl -X GET "http://localhost:3000/api/database-configs/1/tables/your_table_name/query?WHERE=active=1"
```

### 测试数据库连接
```bash
# 测试数据库连接是否正常
curl -X POST http://localhost:3000/api/database-configs/test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_db",
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "test",
    "username": "root",
    "password": "password"
  }'
```

## 开发指南

### 添加新的数据库支持
1. 在 `src/database/connection.ts` 中添加新的数据库配置
2. 更新 `DatabaseConfig` 接口
3. 添加相应的数据库驱动依赖

### 扩展API功能
1. 在 `src/models/` 中定义数据模型
2. 在 `src/services/` 中实现业务逻辑
3. 在 `src/controllers/` 中创建控制器
4. 在 `src/routes/` 中添加路由

### 前端开发
1. 在 `src/components/` 中创建可复用组件
2. 在 `src/views/` 中创建页面组件
3. 在 `src/stores/` 中管理状态
4. 在 `src/router/` 中配置路由

## 部署

### 生产环境部署
```bash
# 构建并启动所有服务
docker-compose -f docker-compose.yml --profile production up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 环境变量
生产环境需要配置以下环境变量：
- `NODE_ENV=production`
- `PORT=3000`
- 数据库连接配置
- `JWT_SECRET` (如果启用认证)

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您遇到问题或有建议，请：
1. 查看 [FAQ](docs/FAQ.md)
2. 搜索现有的 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新信息。
