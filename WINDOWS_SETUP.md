# Windows 环境快速启动指南

## 🚀 最简单的启动方式

### 方法一：一键启动（推荐）

1. 打开命令提示符（CMD）或 PowerShell
2. 进入项目根目录：
   ```cmd
   cd G:\projects\easyprompt
   ```
3. 运行启动脚本：
   ```cmd
   start-dev.bat
   ```

### 方法二：分别启动

**启动后端：**
```cmd
cd G:\projects\easyprompt\easyprompt-backend
npm install
npm run dev
```

**启动前端（新开命令行窗口）：**
```cmd
cd G:\projects\easyprompt\easyprompt-frontend
npm install
npm run dev
```

## 🔧 环境配置

### 后端配置
如果后端启动失败，检查 `easyprompt-backend\.env` 文件：
```env
PORT=3000
NODE_ENV=development
DB_TYPE=sqlite
DB_DATABASE=./easyprompt.db
```

### 前端配置
创建 `easyprompt-frontend\.env.local` 文件：
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🌐 访问地址

启动成功后访问：
- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

## 🐛 常见问题

### 1. 端口被占用
```cmd
# 查看端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# 结束进程
taskkill /PID <进程ID> /F
```

### 2. TypeScript 编译错误
如果遇到编译错误，确保：
- Node.js 版本 >= 16
- npm 包已正确安装

### 3. 数据库问题
默认使用 SQLite，无需额外配置。如需使用 MySQL/PostgreSQL，请修改 `.env` 文件。

## 📝 验证启动

1. 后端启动成功会显示：
   ```
   Server is running on port 3000
   Database initialized successfully
   ```

2. 前端启动成功会显示：
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

3. 测试API：
   ```cmd
   curl http://localhost:3000/health
   ```

## 🎯 下一步

启动成功后：
1. 访问 http://localhost:5173
2. 创建第一个项目
3. 创建提示词表
4. 添加提示词

如需更多帮助，请查看 [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)