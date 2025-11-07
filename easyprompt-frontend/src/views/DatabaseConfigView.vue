<template>
  <div class="database-config">
    <div class="header">
      <h2>数据库配置</h2>
      <button class="btn btn-primary" @click="showCreateModal = true">
        新增数据库配置
      </button>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="clearError" class="btn btn-secondary">重试</button>
    </div>

    <div v-else class="config-list">
      <!-- SQL命令引导区域 -->
      <div class="sql-guide-section">
        <h3>提示词表创建指南</h3>
        <p>在连接数据库之前，请先在您的数据库中创建提示词表。根据您的数据库类型，执行以下SQL命令：</p>
        
        <div class="table-name-input">
          <label for="promptsTableName">提示词表名:</label>
          <input
            id="promptsTableName"
            v-model="promptsTableName"
            type="text"
            placeholder="prompts"
            @input="updateSqlScripts"
          />
        </div>
        
        <div class="table-name-input">
          <label for="promptTablesTableName">提示词分类表名:</label>
          <input
            id="promptTablesTableName"
            v-model="promptTablesTableName"
            type="text"
            placeholder="prompt_tables"
            @input="updateSqlScripts"
          />
        </div>
        
        <div class="sql-tabs">
          <button
            @click="activeSqlTab = 'mysql'"
            :class="['sql-tab', { active: activeSqlTab === 'mysql' }]"
          >
            MySQL
          </button>
          <button
            @click="activeSqlTab = 'postgresql'"
            :class="['sql-tab', { active: activeSqlTab === 'postgresql' }]"
          >
            PostgreSQL
          </button>
        </div>
        
        <div class="sql-content">
          <div v-if="activeSqlTab === 'mysql'" class="sql-code-container">
            <h4>MySQL 提示词表创建命令</h4>
            <div class="sql-code">
              <pre><code>{{ mysqlSql }}</code></pre>
            </div>
            <button @click="copySqlCode('mysql')" class="copy-sql-btn">
              {{ mysqlCopied ? '已复制!' : '复制SQL代码' }}
            </button>
          </div>
          
          <div v-if="activeSqlTab === 'postgresql'" class="sql-code-container">
            <h4>PostgreSQL 提示词表创建命令</h4>
            <div class="sql-code">
              <pre><code>{{ postgresqlSql }}</code></pre>
            </div>
            <button @click="copySqlCode('postgresql')" class="copy-sql-btn">
              {{ postgresqlCopied ? '已复制!' : '复制SQL代码' }}
            </button>
          </div>
        </div>
        
        <div class="connection-guide">
          <h4>连接步骤</h4>
          <ol>
            <li>在您的数据库管理工具中执行上述SQL命令</li>
            <li>确认表创建成功后，点击"新增数据库配置"按钮</li>
            <li>填写数据库连接信息并测试连接</li>
            <li>连接成功后，即可开始使用提示词管理功能</li>
          </ol>
        </div>
      </div>
      
      <div v-if="databaseConfigs.length === 0" class="empty-state">
        暂无数据库配置，请先执行SQL创建表，然后点击"新增数据库配置"按钮添加
      </div>
      
      <div v-else class="config-cards">
        <div
          v-for="config in databaseConfigs"
          :key="config.id"
          class="config-card"
        >
          <div class="config-header">
            <h3>{{ config.name }}</h3>
            <div class="config-type" :class="config.type">
              {{ getDatabaseTypeLabel(config.type) }}
            </div>
          </div>
          
          <div class="config-details">
            <div class="detail-item">
              <span class="label">数据库:</span>
              <span class="value">{{ config.database }}</span>
            </div>
            
            <div v-if="config.host" class="detail-item">
              <span class="label">主机:</span>
              <span class="value">{{ config.host }}:{{ config.port || getDefaultPort(config.type) }}</span>
            </div>
            
            <div v-if="config.username" class="detail-item">
              <span class="label">用户名:</span>
              <span class="value">{{ config.username }}</span>
            </div>
            
            <div class="detail-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(config.created_at) }}</span>
            </div>
          </div>
          
          <div class="config-actions">
            <button
              @click="testConnection(config)"
              class="btn btn-secondary btn-sm"
              :disabled="testingConnection === config.id"
            >
              {{ testingConnection === config.id ? '测试中...' : '测试连接' }}
            </button>
            <button
              @click="editConfig(config)"
              class="btn btn-primary btn-sm"
            >
              编辑
            </button>
            <button
              @click="confirmDeleteConfig(config)"
              class="btn btn-danger btn-sm"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑数据库配置模态框 -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>{{ editingConfig ? '编辑数据库配置' : '新增数据库配置' }}</h3>
        <form @submit.prevent="saveConfig" class="config-form">
          <div class="form-group">
            <label for="name">配置名称</label>
            <input
              id="name"
              v-model="configForm.name"
              type="text"
              required
              placeholder="输入配置名称"
            />
          </div>
          
          <div class="form-group">
            <label for="type">数据库类型</label>
            <select
              id="type"
              v-model="configForm.type"
              required
              @change="onTypeChange"
            >
              <option value="">选择数据库类型</option>
              <option value="sqlite">SQLite</option>
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
            </select>
          </div>
          
          <div v-if="configForm.type === 'sqlite'" class="form-group">
            <label for="database">数据库文件</label>
            <input
              id="database"
              v-model="configForm.database"
              type="text"
              required
              placeholder="输入数据库文件路径"
            />
          </div>
          
          <div v-if="configForm.type === 'mysql' || configForm.type === 'postgresql'">
            <div class="form-group">
              <label for="host">主机地址</label>
              <input
                id="host"
                v-model="configForm.host"
                type="text"
                required
                placeholder="输入数据库主机地址"
              />
            </div>
            
            <div class="form-group">
              <label for="port">端口</label>
              <input
                id="port"
                v-model.number="configForm.port"
                type="number"
                :placeholder="String(getDefaultPort(configForm.type))"
              />
            </div>
            
            <div class="form-group">
              <label for="database">数据库名</label>
              <input
                id="database"
                v-model="configForm.database"
                type="text"
                required
                placeholder="输入数据库名称"
              />
            </div>
            
            <div class="form-group">
              <label for="username">用户名</label>
              <input
                id="username"
                v-model="configForm.username"
                type="text"
                required
                placeholder="输入数据库用户名"
              />
            </div>
            
            <div class="form-group">
              <label for="password">密码</label>
              <input
                id="password"
                v-model="configForm.password"
                type="password"
                required
                placeholder="输入数据库密码"
              />
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              取消
            </button>
            <button type="button" @click="testCurrentConfig" class="btn btn-secondary">
              测试连接
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid">
              {{ editingConfig ? '更新' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal modal-small" @click.stop>
        <h3>确认删除</h3>
        <p>确定要删除数据库配置 "{{ deletingConfig?.name }}" 吗？此操作不可撤销。</p>
        <div class="form-actions">
          <button @click="closeDeleteModal" class="btn btn-secondary">
            取消
          </button>
          <button @click="executeDelete" class="btn btn-danger">
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '@/stores/api'
import type { DatabaseConfig } from '@/types'

const databaseConfigs = ref<DatabaseConfig[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const testingConnection = ref<string | null>(null)

// SQL引导区域相关状态
const activeSqlTab = ref<'mysql' | 'postgresql'>('mysql')
const mysqlCopied = ref(false)
const postgresqlCopied = ref(false)
const promptsTableName = ref('prompts')
const promptTablesTableName = ref('prompt_tables')
const mysqlSql = ref('')
const postgresqlSql = ref('')

// 初始化SQL脚本
const updateSqlScripts = () => {
  // MySQL SQL脚本
  mysqlSql.value = `-- 创建提示词表
CREATE TABLE IF NOT EXISTS \`${promptsTableName.value}\` (
  \`id\` VARCHAR(50) PRIMARY KEY COMMENT '主键ID',
  \`code\` VARCHAR(100) NOT NULL UNIQUE COMMENT '提示词编码',
  \`title\` VARCHAR(255) NOT NULL COMMENT '提示词标题',
  \`content\` TEXT NOT NULL COMMENT '提示词内容',
  \`tags\` VARCHAR(500) COMMENT '标签，多个标签用逗号分隔',
  \`version\` VARCHAR(50) DEFAULT '1.0.0' COMMENT '版本号',
  \`description\` TEXT COMMENT '描述信息',
  \`is_active\` BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  \`table_id\` VARCHAR(50) NOT NULL COMMENT '所属分类表ID',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX \`idx_${promptsTableName.value}_table_id\` (\`table_id\`),
  INDEX \`idx_${promptsTableName.value}_code\` (\`code\`),
  INDEX \`idx_${promptsTableName.value}_is_active\` (\`is_active\`)
) COMMENT='提示词表';

-- 创建提示词分类表
CREATE TABLE IF NOT EXISTS \`${promptTablesTableName.value}\` (
  \`id\` VARCHAR(50) PRIMARY KEY COMMENT '主键ID',
  \`name\` VARCHAR(255) NOT NULL COMMENT '分类名称',
  \`table_name\` VARCHAR(255) NOT NULL UNIQUE COMMENT '表名',
  \`project_id\` VARCHAR(50) NOT NULL COMMENT '所属项目ID',
  \`description\` TEXT COMMENT '描述信息',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX \`idx_${promptTablesTableName.value}_project_id\` (\`project_id\`)
) COMMENT='提示词分类表';`

  // PostgreSQL SQL脚本
  postgresqlSql.value = `-- 创建提示词表
CREATE TABLE IF NOT EXISTS ${promptsTableName.value} (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  tags VARCHAR(500),
  version VARCHAR(50) DEFAULT '1.0.0',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  table_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加表注释
COMMENT ON TABLE ${promptsTableName.value} IS '提示词表';
COMMENT ON COLUMN ${promptsTableName.value}.id IS '主键ID';
COMMENT ON COLUMN ${promptsTableName.value}.code IS '提示词编码';
COMMENT ON COLUMN ${promptsTableName.value}.title IS '提示词标题';
COMMENT ON COLUMN ${promptsTableName.value}.content IS '提示词内容';
COMMENT ON COLUMN ${promptsTableName.value}.tags IS '标签，多个标签用逗号分隔';
COMMENT ON COLUMN ${promptsTableName.value}.version IS '版本号';
COMMENT ON COLUMN ${promptsTableName.value}.description IS '描述信息';
COMMENT ON COLUMN ${promptsTableName.value}.is_active IS '是否激活';
COMMENT ON COLUMN ${promptsTableName.value}.table_id IS '所属分类表ID';
COMMENT ON COLUMN ${promptsTableName.value}.created_at IS '创建时间';
COMMENT ON COLUMN ${promptsTableName.value}.updated_at IS '更新时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_${promptsTableName.value}_table_id ON ${promptsTableName.value}(table_id);
CREATE INDEX IF NOT EXISTS idx_${promptsTableName.value}_code ON ${promptsTableName.value}(code);
CREATE INDEX IF NOT EXISTS idx_${promptsTableName.value}_is_active ON ${promptsTableName.value}(is_active);

-- 创建提示词分类表
CREATE TABLE IF NOT EXISTS ${promptTablesTableName.value} (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  table_name VARCHAR(255) NOT NULL UNIQUE,
  project_id VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加表注释
COMMENT ON TABLE ${promptTablesTableName.value} IS '提示词分类表';
COMMENT ON COLUMN ${promptTablesTableName.value}.id IS '主键ID';
COMMENT ON COLUMN ${promptTablesTableName.value}.name IS '分类名称';
COMMENT ON COLUMN ${promptTablesTableName.value}.table_name IS '表名';
COMMENT ON COLUMN ${promptTablesTableName.value}.project_id IS '所属项目ID';
COMMENT ON COLUMN ${promptTablesTableName.value}.description IS '描述信息';
COMMENT ON COLUMN ${promptTablesTableName.value}.created_at IS '创建时间';
COMMENT ON COLUMN ${promptTablesTableName.value}.updated_at IS '更新时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_${promptTablesTableName.value}_project_id ON ${promptTablesTableName.value}(project_id);`
}

// 初始化SQL脚本
updateSqlScripts()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingConfig = ref<DatabaseConfig | null>(null)
const deletingConfig = ref<DatabaseConfig | null>(null)

const configForm = ref({
  name: '',
  type: 'sqlite' as 'mysql' | 'postgresql' | 'sqlite',
  host: '',
  port: 0,
  database: '',
  username: '',
  password: '',
  filename: ''
})

onMounted(async () => {
  await loadDatabaseConfigs()
})

const loadDatabaseConfigs = async () => {
  loading.value = true
  error.value = null
  try {
    databaseConfigs.value = await api.get('/database-configs')
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

const getDatabaseTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    sqlite: 'SQLite',
    mysql: 'MySQL',
    postgresql: 'PostgreSQL'
  }
  return labels[type] || type
}

const getDefaultPort = (type: string) => {
  const ports: Record<string, number> = {
    sqlite: 0,
    mysql: 3306,
    postgresql: 5432
  }
  return ports[type] || 0
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const onTypeChange = () => {
  // 重置表单字段
  configForm.value.host = ''
  configForm.value.port = 0
  configForm.value.username = ''
  configForm.value.password = ''
  configForm.value.filename = ''
}

const isFormValid = computed(() => {
  if (!configForm.value.name || !configForm.value.type || !configForm.value.database) {
    return false
  }
  
  if ((configForm.value.type === 'mysql' || configForm.value.type === 'postgresql') && 
      (!configForm.value.host || !configForm.value.username || !configForm.value.password)) {
    return false
  }
  
  return true
})

const testConnection = async (config: DatabaseConfig) => {
  testingConnection.value = config.id
  try {
    const response = await api.post('/database-configs/test', config)
    if (response.data && response.data.success) {
      alert('连接测试成功！')
    } else {
      alert(`连接测试失败：${response.data ? response.data.message : '未知错误'}`)
    }
  } catch (err) {
    alert(`连接测试失败：${(err as Error).message}`)
  } finally {
    testingConnection.value = null
  }
}

const testCurrentConfig = async () => {
  try {
    const response = await api.post('/database-configs/test', configForm.value)
    if (response.data && response.data.success) {
      alert('连接测试成功！')
    } else {
      alert(`连接测试失败：${response.data ? response.data.message : '未知错误'}`)
    }
  } catch (err) {
    alert(`连接测试失败：${(err as Error).message}`)
  }
}

const editConfig = (config: DatabaseConfig) => {
  editingConfig.value = config
  configForm.value = {
    name: config.name,
    type: config.type,
    host: config.host || '',
    port: config.port || 0,
    database: config.database,
    username: config.username || '',
    password: config.password || '',
    filename: config.filename || ''
  }
  showEditModal.value = true
}

const confirmDeleteConfig = (config: DatabaseConfig) => {
  deletingConfig.value = config
  showDeleteModal.value = true
}

const executeDelete = async () => {
  if (!deletingConfig.value) return
  
  try {
    await api.delete(`/database-configs/${deletingConfig.value.id}`)
    await loadDatabaseConfigs()
    closeDeleteModal()
  } catch (err) {
    alert('删除失败: ' + (err as Error).message)
  }
}

const saveConfig = async () => {
  try {
    if (editingConfig.value) {
      await api.put(`/database-configs/${editingConfig.value.id}`, configForm.value)
    } else {
      await api.post('/database-configs', configForm.value)
    }
    await loadDatabaseConfigs()
    closeModal()
  } catch (err) {
    alert('保存失败: ' + (err as Error).message)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingConfig.value = null
  configForm.value = {
    name: '',
    type: 'sqlite',
    host: '',
    port: 0,
    database: '',
    username: '',
    password: '',
    filename: ''
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deletingConfig.value = null
}

const clearError = () => {
  error.value = null
}

// 复制SQL代码功能
const copySqlCode = async (type: 'mysql' | 'postgresql') => {
  const sqlCode = type === 'mysql' ? mysqlSql.value : postgresqlSql.value
  try {
    await navigator.clipboard.writeText(sqlCode)
    if (type === 'mysql') {
      mysqlCopied.value = true
      setTimeout(() => { mysqlCopied.value = false }, 2000)
    } else {
      postgresqlCopied.value = true
      setTimeout(() => { postgresqlCopied.value = false }, 2000)
    }
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.database-config {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h2 {
  margin: 0;
  color: #2c3e50;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
}

.empty-state {
  color: #7f8c8d;
}

.config-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.config-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #1976D2;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.config-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.config-type {
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
}

.config-type.sqlite {
  background-color: #003B57;
}

.config-type.mysql {
  background-color: #00758F;
}

.config-type.postgresql {
  background-color: #336791;
}

.config-details {
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.detail-item .label {
  font-weight: 500;
  color: #6c757d;
  min-width: 80px;
}

.detail-item .value {
  color: #2c3e50;
  word-break: break-all;
}

.config-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  width: 95%;
  max-width: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-height: 95vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 400px;
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #1976D2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565C0;
}

.btn-secondary {
  background: #6C757D;
  color: white;
}

.btn-secondary:hover {
  background: #5A6268;
}

.btn-danger {
  background: #DC3545;
  color: white;
}

.btn-danger:hover {
  background: #BB2D3B;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

/* SQL引导区域样式 */
.sql-guide-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e9ecef;
}

.sql-guide-section h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.sql-guide-section p {
  margin-bottom: 1.5rem;
  color: #495057;
  line-height: 1.5;
}

.table-name-input {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.table-name-input label {
  min-width: 140px;
  font-weight: 500;
  color: #495057;
}

.table-name-input input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.table-name-input input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.sql-tabs {
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.sql-tab {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  color: #6c757d;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.sql-tab:hover {
  color: #495057;
}

.sql-tab.active {
  color: #1976D2;
  border-bottom-color: #1976D2;
  font-weight: 500;
}

.sql-content {
  margin-bottom: 1.5rem;
}

.sql-code-container {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #dee2e6;
}

.sql-code-container h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #495057;
  font-size: 1rem;
}

.sql-code {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.sql-code pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #495057;
  white-space: pre-wrap;
}

.copy-sql-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.copy-sql-btn:hover {
  background: #5a6268;
}

.connection-guide {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #dee2e6;
}

.connection-guide h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #495057;
  font-size: 1rem;
}

.connection-guide ol {
  margin: 0;
  padding-left: 1.5rem;
  color: #495057;
  line-height: 1.6;
}

.connection-guide li {
  margin-bottom: 0.5rem;
}
</style>