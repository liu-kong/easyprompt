# 安装和设置

本指南将帮助您快速安装和配置 EasyPrompt 平台。

## 系统要求

- Node.js 16.0 或更高版本
- npm 7.0 或更高版本
- MySQL 5.7+ 或 PostgreSQL 10+ (可选，默认使用 SQLite)

## 安装方式

### 方式一：使用 npm 安装

1. 克隆项目
```bash
git clone https://github.com/your-username/easyprompt.git
cd easyprompt
```

2. 安装后端依赖
```bash
cd easyprompt-backend
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

4. 运行数据库迁移
```bash
npm run migrate
```

5. 启动后端服务
```bash
npm run dev
```

6. 安装前端依赖
```bash
cd ../easyprompt-frontend
npm install
```

7. 启动前端服务
```bash
npm run dev
```

8. 访问应用
打开浏览器访问 `http://localhost:3000`

### 方式二：使用 Docker

1. 使用 Docker Compose 启动所有服务
```bash
docker-compose up -d
```

2. 访问应用
打开浏览器访问 `http://localhost:3000`

## 环境变量配置

在 `easyprompt-backend/.env` 文件中配置以下变量：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置 (SQLite)
DB_TYPE=sqlite
DB_PATH=./data/easyprompt.db

# 数据库配置 (MySQL)
# DB_TYPE=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=easyprompt
# DB_USER=root
# DB_PASSWORD=password

# 数据库配置 (PostgreSQL)
# DB_TYPE=postgresql
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=easyprompt
# DB_USER=postgres
# DB_PASSWORD=password

# JWT 密钥
JWT_SECRET=your-secret-key

# 文件上传路径
UPLOAD_PATH=./uploads
```

## 数据库配置

EasyPrompt 支持三种数据库类型：

### SQLite (默认)
- 适合开发和小型部署
- 无需额外安装数据库服务
- 数据存储在单个文件中

### MySQL
- 适合中大型部署
- 需要安装 MySQL 服务
- 支持高并发和复杂查询

### PostgreSQL
- 适合大型部署
- 需要安装 PostgreSQL 服务
- 支持高级 SQL 功能和扩展

## 验证安装

安装完成后，您应该能够：

1. 访问 EasyPrompt 管理界面
2. 创建第一个项目
3. 添加提示词
4. 测试提示词功能

## 常见问题

### 端口冲突
如果 3000 或 3001 端口已被占用，可以修改 `.env` 文件中的 `PORT` 配置。

### 数据库连接失败
请检查数据库服务是否运行，以及 `.env` 文件中的数据库配置是否正确。

### 权限问题
确保应用有权限写入数据库文件和上传目录。

## 下一步

安装完成后，您可以：

- [创建第一个项目](./projects.md)
- [管理提示词](./prompts.md)
- [配置数据库](./database.md)
- [了解 API](./api-overview.md)