<template>
  <div class="comparison">
    <div class="header">
      <h2>对比分析</h2>
      <div class="comparison-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'tables' }"
          @click="activeTab = 'tables'"
        >
          <span class="tab-icon">表</span>
          表对比
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'versions' }"
          @click="activeTab = 'versions'"
        >
          <span class="tab-icon">版</span>
          版本对比
        </button>
      </div>
    </div>

    <!-- 表对比部分 -->
    <div v-if="activeTab === 'tables'" class="comparison-content">
      <div class="comparison-card">
        <div class="card-header">
          <h3>表对比</h3>
          <p class="card-description">选择两个提示词表进行对比分析</p>
        </div>
        
        <div class="comparison-inputs">
          <div class="input-group">
            <label class="input-label">
              <span class="label-icon">1</span>
              选择第一个表
            </label>
            <select
              v-model="table1Id"
              @change="loadTable1Prompts"
              class="form-select"
            >
              <option value="">请选择表</option>
              <option v-for="table in tables" :key="table.id" :value="table.id">
                {{ table.name }} ({{ table.table_name }})
              </option>
            </select>
          </div>
          
          <div class="vs-divider">
            <span>VS</span>
          </div>
          
          <div class="input-group">
            <label class="input-label">
              <span class="label-icon">2</span>
              选择第二个表
            </label>
            <select
              v-model="table2Id"
              @change="loadTable2Prompts"
              class="form-select"
            >
              <option value="">请选择表</option>
              <option v-for="table in tables" :key="table.id" :value="table.id">
                {{ table.name }} ({{ table.table_name }})
              </option>
            </select>
          </div>
        </div>
        
        <div class="comparison-actions">
          <button
            @click="compareTables"
            class="btn btn-primary btn-large"
            :disabled="!table1Id || !table2Id || comparing"
          >
            <span class="btn-icon">搜索</span>
            开始对比
          </button>
        </div>
      </div>
    </div>

    <!-- 版本对比部分 -->
    <div v-if="activeTab === 'versions'" class="comparison-content">
      <div class="comparison-card">
        <div class="card-header">
          <h3>版本对比</h3>
          <p class="card-description">选择同一提示词的不同版本进行对比</p>
        </div>
        
        <div class="comparison-inputs">
          <div class="input-group full-width">
            <label class="input-label">
              <span class="label-icon">文</span>
              选择提示词
            </label>
            <select
              v-model="versionPromptId"
              @change="loadVersions"
              class="form-select"
            >
              <option value="">请选择提示词</option>
              <option v-for="prompt in allPrompts" :key="prompt.id" :value="prompt.id">
                {{ prompt.title }} ({{ prompt.code }})
              </option>
            </select>
          </div>
        </div>
        
        <div v-if="versionPromptId" class="version-selection">
          <div class="version-inputs">
            <div class="input-group">
              <label class="input-label">
                <span class="label-icon">1</span>
                选择版本1
              </label>
              <select v-model="version1" class="form-select">
                <option value="">请选择版本</option>
                <option v-for="version in versions" :key="version.version" :value="version.version">
                  v{{ version.version }} - {{ formatDate(version.created_at) }}
                </option>
              </select>
            </div>
            
            <div class="vs-divider">
              <span>VS</span>
            </div>
            
            <div class="input-group">
              <label class="input-label">
                <span class="label-icon">2</span>
                选择版本2
              </label>
              <select v-model="version2" class="form-select">
                <option value="">请选择版本</option>
                <option v-for="version in versions" :key="version.version" :value="version.version">
                  v{{ version.version }} - {{ formatDate(version.created_at) }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="comparison-actions">
            <button
              @click="compareVersions"
              class="btn btn-primary btn-large"
              :disabled="!versionPromptId || !version1 || !version2 || comparing"
            >
              <span class="btn-icon">搜索</span>
              开始对比
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="comparing" class="loading-container">
      <div class="loading-spinner"></div>
      <p>对比中，请稍候...</p>
    </div>

    <!-- 表对比结果 -->
    <div v-if="tableComparisonResult" class="comparison-result">
      <div class="result-header">
        <h3>
          <span class="result-icon">表</span>
          表对比结果
        </h3>
        <button @click="clearTableResult" class="btn btn-outline btn-small">
          清除结果
        </button>
      </div>
      
      <div class="result-summary">
        <div class="summary-item">
          <span class="summary-label">对比表:</span>
          <span class="summary-value">{{ tableComparisonResult.table1 }} vs {{ tableComparisonResult.table2 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">差异数量:</span>
          <span class="summary-value highlight">{{ tableComparisonResult.differences.length }} 处</span>
        </div>
      </div>
      
      <div class="differences-list">
        <div
          v-for="(diff, index) in tableComparisonResult.differences"
          :key="index"
          class="difference-item"
        >
          <div class="diff-header">
            <span class="diff-code">{{ diff.code }}</span>
            <span class="diff-field">{{ diff.field }}</span>
          </div>
          <div class="diff-values">
            <div class="diff-value diff-value-1">
              <div class="diff-label">表1值</div>
              <pre>{{ formatValue(diff.value1) }}</pre>
            </div>
            <div class="diff-value diff-value-2">
              <div class="diff-label">表2值</div>
              <pre>{{ formatValue(diff.value2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 版本对比结果 -->
    <div v-if="versionComparisonResult" class="comparison-result">
      <div class="result-header">
        <h3>
          <span class="result-icon">版</span>
          版本对比结果
        </h3>
        <button @click="clearVersionResult" class="btn btn-outline btn-small">
          清除结果
        </button>
      </div>
      
      <div class="result-summary">
        <div class="summary-item">
          <span class="summary-label">对比版本:</span>
          <span class="summary-value">v{{ versionComparisonResult.version1 }} vs v{{ versionComparisonResult.version2 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">差异数量:</span>
          <span class="summary-value highlight">{{ versionComparisonResult.differences.length }} 处</span>
        </div>
      </div>
      
      <div class="differences-list">
        <div
          v-for="(diff, index) in versionComparisonResult.differences"
          :key="index"
          class="difference-item"
        >
          <div class="diff-header">
            <span class="diff-field">{{ diff.field }}</span>
          </div>
          <div class="diff-values">
            <div class="diff-value diff-value-1">
              <div class="diff-label">版本1</div>
              <pre>{{ formatValue(diff.value1) }}</pre>
            </div>
            <div class="diff-value diff-value-2">
              <div class="diff-label">版本2</div>
              <pre>{{ formatValue(diff.value2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/stores/api'
import type { PromptTable, Prompt, PromptVersion, ComparisonResult } from '@/types'

const tables = ref<PromptTable[]>([])
const allPrompts = ref<Prompt[]>([])
const versions = ref<PromptVersion[]>([])

const table1Id = ref('')
const table2Id = ref('')
const versionPromptId = ref('')
const version1 = ref('')
const version2 = ref('')

const comparing = ref(false)
const tableComparisonResult = ref<ComparisonResult | null>(null)
const versionComparisonResult = ref<any>(null)
const activeTab = ref<'tables' | 'versions'>('tables')

onMounted(async () => {
  try {
    // Load all tables for comparison
    const projects = await api.get('/projects')
    const allTables: PromptTable[] = []
    
    for (const project of projects.data) {
      const projectTables = await api.get(`/projects/${project.id}/prompt-tables`)
      allTables.push(...projectTables.data)
    }
    
    tables.value = allTables
    
    // Load all prompts for version comparison
    const prompts = await api.get('/prompts')
    allPrompts.value = prompts.data
  } catch (err) {
    alert('加载数据失败: ' + (err as Error).message)
  }
})

const loadTable1Prompts = async () => {
  // This could be used to show table details if needed
}

const loadTable2Prompts = async () => {
  // This could be used to show table details if needed
}

const loadVersions = async () => {
  if (!versionPromptId.value) {
    versions.value = []
    return
  }
  
  try {
    const response = await api.get(`/prompts/${versionPromptId.value}/versions`)
    versions.value = response.data
  } catch (err) {
    alert('加载版本失败: ' + (err as Error).message)
  }
}

const compareTables = async () => {
  if (!table1Id.value || !table2Id.value) return
  
  comparing.value = true
  try {
    const result = await api.get(`/compare/tables/${table1Id.value}/${table2Id.value}`)
    tableComparisonResult.value = result.data
    versionComparisonResult.value = null
  } catch (err) {
    alert('对比失败: ' + (err as Error).message)
  } finally {
    comparing.value = false
  }
}

const compareVersions = async () => {
  if (!versionPromptId.value || !version1.value || !version2.value) return
  
  comparing.value = true
  try {
    const result = await api.get(`/compare/prompts/${versionPromptId.value}/${version1.value}/${version2.value}`)
    versionComparisonResult.value = result.data
    tableComparisonResult.value = null
  } catch (err) {
    alert('对比失败: ' + (err as Error).message)
  } finally {
    comparing.value = false
  }
}

const formatValue = (value: any) => {
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value, null, 2)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const clearTableResult = () => {
  tableComparisonResult.value = null
}

const clearVersionResult = () => {
  versionComparisonResult.value = null
}
</script>

<style scoped>
.comparison {
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
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.comparison-tabs {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: #1976D2;
  color: #1976D2;
  background: rgba(25, 118, 210, 0.05);
}

.tab-btn.active {
  border-color: #1976D2;
  background: #1976D2;
  color: white;
}

.tab-icon {
  font-size: 1.2rem;
}

.comparison-content {
  margin-bottom: 2rem;
}

.comparison-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.card-header {
  margin-bottom: 2rem;
  text-align: center;
}

.card-header h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.card-description {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
}

.comparison-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: end;
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group.full-width {
  grid-column: 1 / -1;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;
}

.label-icon {
  font-size: 1.1rem;
}

.form-select {
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.version-selection {
  margin-top: 2rem;
}

.version-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: end;
  margin-bottom: 2rem;
}

.comparison-actions {
  display: flex;
  justify-content: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976D2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.comparison-result {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  margin-top: 2rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.result-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-icon {
  font-size: 1.3rem;
}

.result-summary {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  gap: 2rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.summary-value {
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
}

.summary-value.highlight {
  color: #1976D2;
}

.differences-list {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.difference-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.diff-header {
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.diff-code {
  background: #1976D2;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.diff-field {
  background: #6c757d;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.diff-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.diff-value {
  padding: 1.5rem;
  position: relative;
}

.diff-value-1 {
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
}

.diff-value-2 {
  background: #fff;
}

.diff-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.diff-value pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  background: transparent;
  border: none;
  padding: 0;
  color: #495057;
  max-height: 300px;
  overflow-y: auto;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1565C0, #0D47A1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.btn-outline {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline:hover {
  background: #6c757d;
  color: white;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-icon {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .comparison-inputs,
  .version-inputs {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .vs-divider {
    width: 50px;
    height: 50px;
    margin: 0 auto;
  }
  
  .result-summary {
    flex-direction: column;
    gap: 1rem;
  }
  
  .diff-values {
    grid-template-columns: 1fr;
  }
  
  .diff-value-1 {
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }
}
</style>