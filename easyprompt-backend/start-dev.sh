#!/bin/bash

echo "🚀 启动EasyPrompt开发环境..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 检查前端依赖
if [ ! -d "../easyprompt-frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd ../easyprompt-frontend && npm install && cd ..
fi

# 创建环境变量文件
if [ ! -f ".env" ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置您的环境变量"
fi

# 创建数据目录
mkdir -p data
mkdir -p uploads

echo "🗄️  启动后端服务..."
# 启动后端开发服务器
npm run dev &
BACKEND_PID=$!

echo "⏳ 等待后端服务启动..."
sleep 5

echo "🌐 启动前端开发服务器..."
cd ../easyprompt-frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ 开发环境启动完成!"
echo ""
echo "📋 服务信息:"
echo "   后端服务: http://localhost:3000"
echo "   前端服务: http://localhost:5173"
echo "   API文档: http://localhost:3000/api"
echo "   健康检查: http://localhost:3000/health"
echo ""
echo "🛑 停止服务请按 Ctrl+C"

# 等待用户中断
wait $BACKEND_PID $FRONTEND_PID

# 清理进程
echo "🧹 正在停止服务..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "✅ 服务已停止"