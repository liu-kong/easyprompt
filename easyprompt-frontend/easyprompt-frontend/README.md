# EasyPrompt Frontend

EasyPrompt前端应用，基于Vue 3 + TypeScript构建的简单易用的提示词管理平台。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **构建工具**: Vite
- **样式**: CSS3 (响应式设计)

## 功能特性

- 项目管理 - 创建和管理提示词项目
- 提示词管理 - 编辑和管理提示词内容
- 版本控制 - 跟踪提示词的版本变化
- 数据导出 - 导出SQL命令和JSON数据
- 对比分析 - 对比不同版本的提示词差异
- 代码生成 - 生成Python、Java、Go代码

## 开发环境设置

### 推荐IDE设置

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (并禁用Vetur)。

### 推荐浏览器设置

- 基于Chromium的浏览器 (Chrome, Edge, Brave等):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [在Chrome DevTools中启用自定义对象格式化程序](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [在Firefox DevTools中启用自定义对象格式化程序](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## TypeScript中`.vue`导入的类型支持

TypeScript默认无法处理`.vue`导入的类型信息，因此我们用`vue-tsc`替换`tsc` CLI进行类型检查。在编辑器中，我们需要[Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)来使TypeScript语言服务了解`.vue`类型。

## 项目设置

```sh
npm install
```

### 开发环境编译和热重载

```sh
npm run dev
```

### 生产环境类型检查、编译和压缩

```sh
npm run build
```

### 使用[ESLint](https://eslint.org/)进行代码检查

```sh
npm run lint
```

### 代码格式化

```sh
npm run format
```

## 环境变量

创建`.env`文件（参考`.env.example`）：

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=EasyPrompt
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=true
```

## 自定义配置

参见[Vite配置参考](https://vite.dev/config/)。

## 项目结构

```
src/
├── assets/         # 静态资源
├── components/      # 可复用组件
├── router/         # 路由配置
├── stores/         # Pinia状态管理
├── types/          # TypeScript类型定义
├── views/          # 页面组件
├── App.vue         # 根组件
└── main.ts         # 应用入口
```

## 部署

### Docker部署

```sh
# 构建镜像
docker build -t easyprompt-frontend .

# 运行容器
docker run -p 5173:5173 easyprompt-frontend
```

### 使用Docker Compose

```sh
# 与后端一起部署
docker-compose up -d
```
