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
      <div v-if="databaseConfigs.length === 0" class="empty-state">
        暂无数据库配置，请点击"新增数据库配置"按钮添加
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
                :placeholder="getDefaultPort(configForm.type)"
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
    if (response.success) {
      alert('连接测试成功！')
    } else {
      alert(`连接测试失败：${response.message}`)
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
    if (response.success) {
      alert('连接测试成功！')
    } else {
      alert(`连接测试失败：${response.message}`)
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
</style>