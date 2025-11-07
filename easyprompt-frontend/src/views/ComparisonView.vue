<template>
  <div class="comparison">
    <div class="header">
      <h2>对比分析</h2>
    </div>

    <div class="comparison-sections">
      <div class="comparison-section">
        <h3>表对比</h3>
        <div class="form-group">
          <label>选择第一个表</label>
          <select v-model="table1Id" @change="loadTable1Prompts">
            <option value="">请选择表</option>
            <option v-for="table in tables" :key="table.id" :value="table.id">
              {{ table.name }} ({{ table.table_name }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>选择第二个表</label>
          <select v-model="table2Id" @change="loadTable2Prompts">
            <option value="">请选择表</option>
            <option v-for="table in tables" :key="table.id" :value="table.id">
              {{ table.name }} ({{ table.table_name }})
            </option>
          </select>
        </div>
        <div class="comparison-actions">
          <button 
            @click="compareTables" 
            class="btn btn-primary"
            :disabled="!table1Id || !table2Id || comparing"
          >
            开始对比
          </button>
        </div>
      </div>

      <div class="comparison-section">
        <h3>版本对比</h3>
        <div class="form-group">
          <label>选择提示词</label>
          <select v-model="versionPromptId" @change="loadVersions">
            <option value="">请选择提示词</option>
            <option v-for="prompt in allPrompts" :key="prompt.id" :value="prompt.id">
              {{ prompt.title }} ({{ prompt.code }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>选择版本1</label>
          <select v-model="version1">
            <option value="">请选择版本</option>
            <option v-for="version in versions" :key="version.version" :value="version.version">
              {{ version.version }} - {{ formatDate(version.created_at) }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>选择版本2</label>
          <select v-model="version2">
            <option value="">请选择版本</option>
            <option v-for="version in versions" :key="version.version" :value="version.version">
              {{ version.version }} - {{ formatDate(version.created_at) }}
            </option>
          </select>
        </div>
        <div class="comparison-actions">
          <button 
            @click="compareVersions" 
            class="btn btn-primary"
            :disabled="!versionPromptId || !version1 || !version2 || comparing"
          >
            开始对比
          </button>
        </div>
      </div>
    </div>

    <div v-if="comparing" class="loading">
      对比中，请稍候...
    </div>

    <div v-if="tableComparisonResult" class="comparison-result">
      <h3>表对比结果</h3>
      <div class="result-summary">
        <p>对比表: {{ tableComparisonResult.table1 }} vs {{ tableComparisonResult.table2 }}</p>
        <p>发现 {{ tableComparisonResult.differences.length }} 处差异</p>
      </div>
      <div class="differences-list">
        <div 
          v-for="(diff, index) in tableComparisonResult.differences" 
          :key="index"
          class="difference-item"
        >
          <div class="diff-header">
            <strong>提示词代码:</strong> {{ diff.code }}
          </div>
          <div class="diff-details">
            <div class="diff-field">
              <strong>字段:</strong> {{ diff.field }}
            </div>
            <div class="diff-values">
              <div class="diff-value">
                <strong>表1值:</strong>
                <pre>{{ formatValue(diff.value1) }}</pre>
              </div>
              <div class="diff-value">
                <strong>表2值:</strong>
                <pre>{{ formatValue(diff.value2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="versionComparisonResult" class="comparison-result">
      <h3>版本对比结果</h3>
      <div class="result-summary">
        <p>对比版本: {{ versionComparisonResult.version1 }} vs {{ versionComparisonResult.version2 }}</p>
        <p>发现 {{ versionComparisonResult.differences.length }} 处差异</p>
      </div>
      <div class="differences-list">
        <div 
          v-for="(diff, index) in versionComparisonResult.differences" 
          :key="index"
          class="difference-item"
        >
          <div class="diff-header">
            <strong>字段:</strong> {{ diff.field }}
          </div>
          <div class="diff-details">
            <div class="diff-values">
              <div class="diff-value">
                <strong>版本1:</strong>
                <pre>{{ formatValue(diff.value1) }}</pre>
              </div>
              <div class="diff-value">
                <strong>版本2:</strong>
                <pre>{{ formatValue(diff.value2) }}</pre>
              </div>
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

onMounted(async () => {
  try {
    // Load all tables for comparison
    const projects = await api.get('/projects')
    const allTables: PromptTable[] = []
    
    for (const project of projects) {
      const projectTables = await api.get(`/projects/${project.id}/prompt-tables`)
      allTables.push(...projectTables)
    }
    
    tables.value = allTables
    
    // Load all prompts for version comparison
    const prompts = await api.get('/prompts')
    allPrompts.value = prompts
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
    versions.value = await api.get(`/prompts/${versionPromptId.value}/versions`)
  } catch (err) {
    alert('加载版本失败: ' + (err as Error).message)
  }
}

const compareTables = async () => {
  if (!table1Id.value || !table2Id.value) return
  
  comparing.value = true
  try {
    const result = await api.get(`/compare/tables/${table1Id.value}/${table2Id.value}`)
    tableComparisonResult.value = result
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
    versionComparisonResult.value = result
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
}

.comparison-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.comparison-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.comparison-section h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1rem;
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

.comparison-actions {
  margin-top: 1.5rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: #1976D2;
}

.comparison-result {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}

.comparison-result h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.result-summary {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.result-summary p {
  margin: 0.5rem 0;
  color: #555;
}

.differences-list {
  max-height: 500px;
  overflow-y: auto;
}

.difference-item {
  border: 1px solid #e9ecef;
  border-radius: 4px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.diff-header {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
  font-weight: 500;
}

.diff-details {
  padding: 1rem;
}

.diff-field {
  margin-bottom: 1rem;
  font-weight: 500;
  color: #2c3e50;
}

.diff-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.diff-value {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.diff-value strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.diff-value pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
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
</style>