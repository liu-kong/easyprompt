<template>
  <div class="export">
    <div class="header">
      <h2>数据导出</h2>
    </div>

    <div class="export-sections">
      <div class="export-section">
        <h3>项目导出</h3>
        <div class="form-group">
          <label>选择项目</label>
          <select v-model="selectedProjectId">
            <option value="">请选择项目</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
        <div class="export-actions">
          <button 
            @click="exportProjectAsSQL" 
            class="btn btn-primary"
            :disabled="!selectedProjectId || exporting"
          >
            导出为SQL
          </button>
          <button 
            @click="exportProjectAsJSON" 
            class="btn btn-secondary"
            :disabled="!selectedProjectId || exporting"
          >
            导出为JSON
          </button>
        </div>
      </div>

      <div class="export-section">
        <h3>提示词表导出</h3>
        <div class="form-group">
          <label>选择提示词表</label>
          <select v-model="selectedTableId">
            <option value="">请选择表</option>
            <option v-for="table in tables" :key="table.id" :value="table.id">
              {{ table.name }} ({{ table.table_name }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>导出格式</label>
          <select v-model="exportFormat">
            <option value="insert">INSERT语句</option>
            <option value="update">UPDATE语句</option>
          </select>
        </div>
        <div class="export-actions">
          <button 
            @click="exportTableAsSQL" 
            class="btn btn-primary"
            :disabled="!selectedTableId || exporting"
          >
            导出为SQL
          </button>
          <button 
            @click="exportTableAsJSON" 
            class="btn btn-secondary"
            :disabled="!selectedTableId || exporting"
          >
            导出为JSON
          </button>
        </div>
      </div>
    </div>

    <div v-if="exporting" class="loading">
      导出中，请稍候...
    </div>

    <div v-if="exportResult" class="export-result">
      <h3>导出结果</h3>
      <div class="result-content">
        <pre>{{ exportResult }}</pre>
      </div>
      <div class="result-actions">
        <button @click="copyToClipboard" class="btn btn-secondary">
          复制到剪贴板
        </button>
        <button @click="downloadFile" class="btn btn-primary">
          下载文件
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/stores/api'
import type { Project, PromptTable } from '@/types'

const projects = ref<Project[]>([])
const tables = ref<PromptTable[]>([])
const selectedProjectId = ref('')
const selectedTableId = ref('')
const exportFormat = ref('insert')
const exporting = ref(false)
const exportResult = ref('')

onMounted(async () => {
  try {
    projects.value = await api.get('/projects')
  } catch (err) {
    alert('加载项目失败: ' + (err as Error).message)
  }
})

const loadTables = async () => {
  if (!selectedProjectId.value) {
    tables.value = []
    return
  }
  
  try {
    tables.value = await api.get(`/projects/${selectedProjectId.value}/prompt-tables`)
  } catch (err) {
    alert('加载提示词表失败: ' + (err as Error).message)
  }
}

const exportProjectAsSQL = async () => {
  if (!selectedProjectId.value) return
  
  exporting.value = true
  try {
    const response = await api.get(`/export/project/${selectedProjectId.value}?operation=${exportFormat.value}`)
    exportResult.value = response
  } catch (err) {
    alert('导出失败: ' + (err as Error).message)
  } finally {
    exporting.value = false
  }
}

const exportProjectAsJSON = async () => {
  if (!selectedProjectId.value) return
  
  exporting.value = true
  try {
    const response = await api.get(`/export/project/${selectedProjectId.value}/json`)
    exportResult.value = JSON.stringify(response, null, 2)
  } catch (err) {
    alert('导出失败: ' + (err as Error).message)
  } finally {
    exporting.value = false
  }
}

const exportTableAsSQL = async () => {
  if (!selectedTableId.value) return
  
  exporting.value = true
  try {
    const response = await api.get(`/export/prompts/${selectedTableId.value}?operation=${exportFormat.value}`)
    exportResult.value = response
  } catch (err) {
    alert('导出失败: ' + (err as Error).message)
  } finally {
    exporting.value = false
  }
}

const exportTableAsJSON = async () => {
  if (!selectedTableId.value) return
  
  exporting.value = true
  try {
    const response = await api.get(`/export/table/${selectedTableId.value}/json`)
    exportResult.value = JSON.stringify(response, null, 2)
  } catch (err) {
    alert('导出失败: ' + (err as Error).message)
  } finally {
    exporting.value = false
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(exportResult.value)
    alert('已复制到剪贴板')
  } catch (err) {
    alert('复制失败: ' + (err as Error).message)
  }
}

const downloadFile = () => {
  const blob = new Blob([exportResult.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `export_${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Watch for project selection changes
watch(selectedProjectId, loadTables)
</script>

<style scoped>
.export {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h2 {
  color: #2c3e50;
}

.export-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.export-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.export-section h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.export-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: #1976D2;
}

.export-result {
  margin-top: 2rem;
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.export-result h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.result-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.result-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.4;
}

.result-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
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

.btn-secondary:hover:not(:disabled) {
  background: #5A6268;
}
</style>