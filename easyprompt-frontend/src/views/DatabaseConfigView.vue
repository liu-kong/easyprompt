<template>
  <div class="database-config">
    <div class="header">
      <div class="header-content">
        <div class="header-text">
          <h2>数据库配置</h2>
          <p class="header-subtitle">管理和配置数据库连接</p>
        </div>
        <button class="btn btn-primary btn-large" @click="showCreateModal = true">
          新增数据库配置
        </button>
      </div>
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
          <button
            @click="activeSqlTab = 'mapping'"
            :class="['sql-tab', { active: activeSqlTab === 'mapping' }]"
          >
            字段映射
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
        
        <!-- 字段映射区域 -->
        <div v-if="activeSqlTab === 'mapping'" class="mapping-container">
          <h4>现有表字段映射</h4>
          <p>如果您已有现有的表结构，可以将您的字段映射到系统的标准字段，以便正常使用提示词管理功能。</p>
          
          <div class="mapping-section">
            <h5>提示词表字段映射</h5>
            <div class="mapping-table">
              <div class="mapping-header">
                <div class="mapping-col">系统字段</div>
                <div class="mapping-col">字段说明</div>
                <div class="mapping-col">您的字段</div>
              </div>
              
              <div class="mapping-row" v-for="field in promptFields" :key="field.name">
                <div class="mapping-col system-field">{{ field.name }}</div>
                <div class="mapping-col field-desc">{{ field.description }}</div>
                <div class="mapping-col">
                  <input
                    v-model="fieldMappings[field.name]"
                    type="text"
                    :placeholder="field.name"
                    class="mapping-input"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="mapping-section">
            <h5>提示词分类表字段映射</h5>
            <div class="mapping-table">
              <div class="mapping-header">
                <div class="mapping-col">系统字段</div>
                <div class="mapping-col">字段说明</div>
                <div class="mapping-col">您的字段</div>
              </div>
              
              <div class="mapping-row" v-for="field in promptTableFields" :key="field.name">
                <div class="mapping-col system-field">{{ field.name }}</div>
                <div class="mapping-col field-desc">{{ field.description }}</div>
                <div class="mapping-col">
                  <input
                    v-model="fieldMappings[field.name]"
                    type="text"
                    :placeholder="field.name"
                    class="mapping-input"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="mapping-actions">
            <button @click="resetMappings" class="btn btn-secondary">重置映射</button>
            <button @click="copyMappingConfig" class="btn btn-primary">复制映射配置</button>
          </div>
          
          <div class="mapping-note">
            <p><strong>使用说明：</strong></p>
            <ol>
              <li>在"您的字段"列中输入您现有表中对应的字段名</li>
              <li>如果某个字段在您的表中不存在，可以留空</li>
              <li>点击"复制映射配置"获取JSON格式的映射配置</li>
              <li>在数据库配置中应用此映射配置</li>
            </ol>
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
        <div class="modal-header">
          <h3>{{ editingConfig ? '编辑数据库配置' : '新增数据库配置' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
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
          </form>
        </div>
        <div class="form-actions">
          <button type="button" @click="closeModal" class="btn btn-secondary">
            取消
          </button>
          <button type="button" @click="testCurrentConfig" class="btn btn-secondary">
            测试连接
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid" @click="saveConfig">
            {{ editingConfig ? '更新' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal modal-small" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <p>确定要删除数据库配置 "{{ deletingConfig?.name }}" 吗？此操作不可撤销。</p>
        </div>
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
const activeSqlTab = ref<'mysql' | 'postgresql' | 'mapping'>('mysql')
const mysqlCopied = ref(false)
const postgresqlCopied = ref(false)
const promptsTableName = ref('prompts')
const promptTablesTableName = ref('prompt_tables')
const mysqlSql = ref('')
const postgresqlSql = ref('')

// 字段映射相关状态
const fieldMappings = ref<Record<string, string>>({})

// 系统字段定义
const promptFields = [
  { name: 'id', description: '主键ID，唯一标识符' },
  { name: 'code', description: '提示词编码，用于业务识别' },
  { name: 'title', description: '提示词标题，显示名称' },
  { name: 'content', description: '提示词内容，核心文本' },
  { name: 'tags', description: '标签，多个标签用逗号分隔' },
  { name: 'version', description: '版本号，默认为1.0.0' },
  { name: 'description', description: '描述信息，详细说明' },
  { name: 'is_active', description: '是否激活，布尔值' },
  { name: 'table_id', description: '所属分类表ID，外键' },
  { name: 'created_at', description: '创建时间，时间戳' },
  { name: 'updated_at', description: '更新时间，时间戳' }
]

const promptTableFields = [
  { name: 'id', description: '主键ID，唯一标识符' },
  { name: 'name', description: '分类名称，显示名称' },
  { name: 'table_name', description: '表名，唯一标识' },
  { name: 'project_id', description: '所属项目ID，外键' },
  { name: 'description', description: '描述信息，详细说明' },
  { name: 'created_at', description: '创建时间，时间戳' },
  { name: 'updated_at', description: '更新时间，时间戳' }
]

// 初始化字段映射
const initializeFieldMappings = () => {
  const mappings: Record<string, string> = {}
  promptFields.forEach(field => {
    mappings[field.name] = field.name
  })
  promptTableFields.forEach(field => {
    mappings[field.name] = field.name
  })
  fieldMappings.value = mappings
}

// 重置字段映射
const resetMappings = () => {
  initializeFieldMappings()
}

// 复制映射配置
const copyMappingConfig = async () => {
  const config: Record<string, Record<string, string>> = {
    prompts: {},
    prompt_tables: {}
  }
  
  promptFields.forEach(field => {
    const fieldValue = fieldMappings.value[field.name]
    if (fieldValue && fieldValue !== field.name && config.prompts) {
      config.prompts[field.name] = fieldValue
    }
  })
  
  promptTableFields.forEach(field => {
    const fieldValue = fieldMappings.value[field.name]
    if (fieldValue && fieldValue !== field.name && config.prompt_tables) {
      config.prompt_tables[field.name] = fieldValue
    }
  })
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    alert('映射配置已复制到剪贴板！')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

// 初始化字段映射
initializeFieldMappings()

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
  padding: 1.5rem;
}

.header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-text h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
}

.header-subtitle {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
}

.btn-large {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
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
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.config-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
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
  border-radius: 12px;
  padding: 0;
  width: 95%;
  max-width: 600px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 95vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
  display: flex;
  flex-direction: column;
}

.modal-small {
  max-width: 400px;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #e74c3c;
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.25rem;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #e9ecef;
  background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,1));
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1565C0, #0D47A1);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(25, 118, 210, 0.35);
}

.btn-secondary {
  background: linear-gradient(135deg, #6C757D, #5A6268);
  color: white;
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.25);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #5A6268, #495057);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(108, 117, 125, 0.35);
}

.btn-danger {
  background: linear-gradient(135deg, #DC3545, #BB2D3B);
  color: white;
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.25);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #BB2D3B, #A02622);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(220, 53, 69, 0.35);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

/* SQL引导区域样式 */
.sql-guide-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.sql-guide-section h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
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
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.table-name-input label {
  min-width: 140px;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.table-name-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
}

.table-name-input input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
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
  transition: all 0.2s ease;
}

.sql-tab:hover {
  color: #495057;
  background: rgba(25, 118, 210, 0.05);
}

.sql-tab.active {
  color: #1976D2;
  border-bottom-color: #1976D2;
  font-weight: 500;
  background: rgba(25, 118, 210, 0.05);
}

.sql-content {
  margin-bottom: 1.5rem;
}

.sql-code-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sql-code-container h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.sql-code {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid #e9ecef;
}

.sql-code pre {
  margin: 0;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #495057;
  white-space: pre-wrap;
}

.copy-sql-btn {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.2);
}

.copy-sql-btn:hover {
  background: linear-gradient(135deg, #5a6268, #495057);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
}

.connection-guide {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.connection-guide h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
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

/* 字段映射样式 */
.mapping-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.mapping-container h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.mapping-container p {
  margin-bottom: 1.5rem;
  color: #495057;
  line-height: 1.5;
}

.mapping-section {
  margin-bottom: 2rem;
}

.mapping-section h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.mapping-table {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.mapping-header {
  display: grid;
  grid-template-columns: 1fr 2fr 1.5fr;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #e9ecef;
}

.mapping-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1.5fr;
  border-bottom: 1px solid #e9ecef;
}

.mapping-row:last-child {
  border-bottom: none;
}

.mapping-col {
  padding: 0.75rem;
  display: flex;
  align-items: center;
  border-right: 1px solid #e9ecef;
}

.mapping-col:last-child {
  border-right: none;
}

.system-field {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-weight: 600;
  color: #495057;
  background: #f8f9fa;
}

.field-desc {
  color: #6c757d;
  font-size: 0.9rem;
}

.mapping-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #e9ecef;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  transition: all 0.2s ease;
}

.mapping-input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.mapping-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.mapping-note {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  border-left: 4px solid #1976D2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.mapping-note p {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-weight: 500;
}

.mapping-note ol {
  margin: 0;
  padding-left: 1.5rem;
  color: #495057;
}

.mapping-note li {
  margin-bottom: 0.25rem;
}
</style>