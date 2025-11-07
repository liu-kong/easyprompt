# API 概览

EasyPrompt 提供了完整的 RESTful API，支持所有核心功能的程序化访问。本节将介绍 API 的基本结构和使用方法。

## API 基础信息

- **基础 URL**：`http://localhost:3001/api`
- **认证方式**：JWT Bearer Token
- **数据格式**：JSON
- **字符编码**：UTF-8

## 认证

### 获取访问令牌

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 使用访问令牌

在请求头中添加 Authorization 字段：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 项目 API

### 获取项目列表

```http
GET /api/projects
```

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "id": "1234567890123456789",
      "name": "示例项目",
      "description": "这是一个示例项目",
      "is_active": true,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### 创建项目

```http
POST /api/projects
Content-Type: application/json

{
  "name": "新项目",
  "description": "项目描述",
  "is_active": true
}
```

### 更新项目

```http
PUT /api/projects/:id
Content-Type: application/json

{
  "name": "更新的项目名称",
  "description": "更新的项目描述"
}
```

### 删除项目

```http
DELETE /api/projects/:id
```

## 提示词 API

### 获取提示词列表

```http
GET /api/prompts?projectId=123&search=keyword&page=1&limit=10
```

**查询参数**：
- `projectId`：项目 ID（可选）
- `search`：搜索关键词（可选）
- `page`：页码（默认：1）
- `limit`：每页数量（默认：10）

### 创建提示词

```http
POST /api/prompts
Content-Type: application/json

{
  "project_id": "1234567890123456789",
  "code": "example_prompt",
  "name": "示例提示词",
  "content": "这是一个示例提示词内容",
  "remark": "备注信息"
}
```

### 更新提示词

```http
PUT /api/prompts/:id
Content-Type: application/json

{
  "name": "更新的提示词名称",
  "content": "更新的提示词内容"
}
```

### 删除提示词

```http
DELETE /api/prompts/:id
```

## 数据库配置 API

### 获取数据库配置列表

```http
GET /api/database-configs
```

### 创建数据库配置

```http
POST /api/database-configs
Content-Type: application/json

{
  "name": "MySQL 配置",
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "easyprompt",
  "username": "root",
  "password": "password"
}
```

### 测试数据库连接

```http
POST /api/database-configs/test
Content-Type: application/json

{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "easyprompt",
  "username": "root",
  "password": "password"
}
```

## 导出 API

### 导出 SQL

```http
POST /api/export/sql
Content-Type: application/json

{
  "type": "insert",
  "projectIds": ["1234567890123456789"],
  "includeIds": true,
  "includeTimestamps": true
}
```

### 导出 JSON

```http
POST /api/export/json
Content-Type: application/json

{
  "projectIds": ["1234567890123456789"],
  "includeVersions": true
}
```

## 代码生成 API

### 生成 Python 代码

```http
POST /api/code-generation/python
Content-Type: application/json

{
  "projectId": "1234567890123456789",
  "prompts": ["prompt1", "prompt2"],
  "options": {
    "includeAsync": true,
    "includeErrorHandling": true
  }
}
```

### 生成 Java 代码

```http
POST /api/code-generation/java
Content-Type: application/json

{
  "projectId": "1234567890123456789",
  "prompts": ["prompt1", "prompt2"],
  "options": {
    "packageName": "com.example.easyprompt",
    "includeAsync": true
  }
}
```

### 生成 Go 代码

```http
POST /api/code-generation/go
Content-Type: application/json

{
  "projectId": "1234567890123456789",
  "prompts": ["prompt1", "prompt2"],
  "options": {
    "packageName": "easyprompt",
    "includeContext": true
  }
}
```

## 错误处理

API 使用标准 HTTP 状态码表示请求结果：

- `200`：请求成功
- `201`：创建成功
- `400`：请求参数错误
- `401`：未授权
- `403`：禁止访问
- `404`：资源不存在
- `500`：服务器内部错误

错误响应格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "field": "name",
      "reason": "名称不能为空"
    }
  }
}
```

## 限流

API 实施了请求限流：

- 每个用户每分钟最多 100 次请求
- 超出限制将返回 `429 Too Many Requests`

## SDK 和示例

### Python SDK

```python
from easyprompt_client import EasyPromptClient

client = EasyPromptClient(
    base_url="http://localhost:3001/api",
    token="your-jwt-token"
)

# 获取项目列表
projects = client.projects.list()

# 创建提示词
prompt = client.prompts.create(
    project_id="1234567890123456789",
    code="example_prompt",
    name="示例提示词",
    content="这是一个示例提示词内容"
)
```

### JavaScript SDK

```javascript
import { EasyPromptClient } from 'easyprompt-client';

const client = new EasyPromptClient({
  baseURL: 'http://localhost:3001/api',
  token: 'your-jwt-token'
});

// 获取项目列表
const projects = await client.projects.list();

// 创建提示词
const prompt = await client.prompts.create({
  projectId: '1234567890123456789',
  code: 'example_prompt',
  name: '示例提示词',
  content: '这是一个示例提示词内容'
});
```

## 最佳实践

1. **错误处理**：始终检查 API 响应的状态和错误信息
2. **重试机制**：对于网络错误，实现适当的重试机制
3. **缓存**：对不常变化的数据使用缓存
4. **分页**：使用分页参数处理大量数据
5. **认证**：安全存储和使用访问令牌

## 相关功能

- [项目管理](./projects.md)
- [提示词管理](./prompts.md)
- [代码生成](./getting-started.md)