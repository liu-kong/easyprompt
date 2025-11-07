# 本地开发调试指南

本文档详细说明如何在本地环境中启动和调试EasyPrompt项目的前后端服务。

## 🚀 快速启动

### Windows 环境（推荐）

#### 方法一：一键启动脚本（Windows）

```cmd
# 克隆项目
git clone <repository-url>
cd easyprompt

# 运行一键启动脚本（会同时启动后端和前端）
start-dev.bat
```

启动脚本会自动：
- 安装后端依赖
- 配置环境变量
- 启动后端服务（端口3000）
- 安装前端依赖
- 配置前端环境变量
- 启动前端开发服务器（端口5173）

#### 方法二：分别启动（Windows）

**启动后端：**
```cmd
cd easyprompt-backend
start-dev.bat
```

**启动前端（新开命令行窗口）：**
```cmd
cd easyprompt-frontend
start-dev.bat
```

### Linux/Mac 环境

#### 方法一：一键启动脚本（Linux/Mac）

```bash
# 1. 克隆项目
git clone <repository-url>
cd easyprompt

# 2. 给启动脚本添加执行权限
chmod +x easyprompt-backend/start-dev.sh

# 3. 运行一键启动脚本（会同时启动后端和前端）
./easyprompt-backend/start-dev.sh
```

#### 方法二：分别启动（Linux/Mac）

#### 步骤1：启动后端服务

```bash
# 进入后端目录
cd easyprompt-backend

# 安装依赖
npm install

# 复制环境变量配置文件
cp .env.example .env

# 编辑环境变量文件（可选，默认使用SQLite）
# notepad .env  # Windows
# nano .env      # Linux/Mac

# 启动后端开发服务器
npm run dev
```

后端服务启动后，你应该看到类似输出：
```
[INFO] Server is running on port 3000
[INFO] Database connected successfully
[INFO] EasyPrompt API server started at http://localhost:3000
```

#### 步骤2：启动前端服务（新开终端窗口）

```bash
# 进入前端目录
cd easyprompt-frontend

# 安装依赖
npm install

# 创建前端环境变量文件
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env.local

# 启动前端开发服务器
npm run dev
```

前端服务启动后，你应该看到类似输出：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 🔧 开发环境配置

### 后端环境变量配置

编辑 `easyprompt-backend/.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置（默认使用SQLite，无需额外配置）
DB_TYPE=sqlite
DB_DATABASE=./easyprompt.db

# 如果需要使用MySQL，请修改以下配置
# DB_TYPE=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_DATABASE=easyprompt
# DB_USERNAME=root
# DB_PASSWORD=your_password

# 如果需要使用PostgreSQL，请修改以下配置
# DB_TYPE=postgresql
# DB_HOST=localhost
# DB_PORT=5432
# DB_DATABASE=easyprompt
# DB_USERNAME=postgres
# DB_PASSWORD=your_password
```

### 前端环境变量配置

创建 `easyprompt-frontend/.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🌐 访问地址

启动成功后，可以通过以下地址访问：

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/health

## 🐛 常见问题排查

### 1. 端口被占用

如果遇到端口被占用的错误：

```bash
# 查看端口占用情况（Windows）
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# 查看端口占用情况（Linux/Mac）
lsof -i :3000
lsof -i :5173

# 杀死占用进程（Windows）
taskkill /PID <进程ID> /F

# 杀死占用进程（Linux/Mac）
kill -9 <进程ID>
```

### 2. 数据库连接失败

如果遇到数据库连接问题：

- **SQLite**: 确保有写入权限，检查文件路径
- **MySQL/PostgreSQL**: 确保数据库服务运行正常，检查连接参数

### 3. 依赖安装失败

如果npm安装失败：

```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

### 4. 前端无法连接后端

确保：
- 后端服务正在运行（访问 http://localhost:3000/health 测试）
- 前端环境变量 `VITE_API_BASE_URL` 配置正确
- 没有防火墙阻止连接

## 🛠️ 开发工具推荐

### VS Code 扩展推荐

- **Vue Language Features (Volar)** - Vue 3 开发支持
- **TypeScript Importer** - 自动导入TypeScript类型
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Thunder Client** - API测试工具

### 浏览器开发工具

- **Vue Devtools** - Vue应用调试
- **React Developer Tools** - 如果使用React组件

## 📝 开发工作流

### 1. 修改后端代码

1. 在 `easyprompt-backend/src/` 目录下修改代码
2. 后端服务会自动重启（nodemon）
3. 在浏览器或API工具中测试更改

### 2. 修改前端代码

1. 在 `easyprompt-frontend/src/` 目录下修改代码
2. 前端服务会自动热重载
3. 在浏览器中查看更改效果

### 3. 调试API

使用以下工具调试API：
- **Thunder Client** (VS Code扩展)
- **Postman**
- **curl命令**

示例：
```bash
# 测试健康检查
curl http://localhost:3000/health

# 获取项目列表
curl http://localhost:3000/api/projects

# 创建新项目
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "测试项目", "description": "这是一个测试项目"}'
```

## 🔄 数据库管理

### 查看数据库内容

```bash
# SQLite（默认）
cd easyprompt-backend
sqlite3 easyprompt.db
.tables
SELECT * FROM projects;
SELECT * FROM prompt_tables;
SELECT * FROM prompts;
```

### 重置数据库

```bash
# 删除数据库文件
cd easyprompt-backend
rm easyprompt.db

# 重启后端服务，会自动创建新的数据库
npm run dev
```

## 📚 有用的命令

```bash
# 后端相关
cd easyprompt-backend
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产版本
npm test             # 运行测试

# 前端相关
cd easyprompt-frontend
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
npm test             # 运行测试
```

## 🎯 下一步

启动开发环境后，你可以：

1. 访问 http://localhost:5173 查看前端界面
2. 创建第一个项目和提示词表
3. 测试各种功能（版本管理、导出、对比等）
4. 查看API文档了解所有可用的接口
5. 根据需要修改和扩展功能

如果遇到任何问题，请查看控制台输出的错误信息，或参考本文档的常见问题排查部分。