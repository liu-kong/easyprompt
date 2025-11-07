#!/bin/bash

echo "🚀 启动EasyPrompt前端开发环境..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 创建环境变量文件
if [ ! -f ".env.local" ]; then
    echo "📝 创建本地环境变量文件..."
    cat > .env.local << EOF
# 本地开发环境配置
VITE_API_BASE_URL=http://localhost:3000/api
EOF
fi

echo "🌐 启动前端开发服务器..."
npm run dev

echo "✅ 前端开发服务器已启动!"
echo ""
echo "📋 服务信息:"
echo "   前端服务: http://localhost:5173"
echo "   后端API: http://localhost:3000/api"
echo ""
echo "🛑 停止服务请按 Ctrl+C"