<template>
  <div class="prompts">
    <div class="header">
      <div class="header-content">
        <div class="header-text">
          <h2>提示词管理</h2>
          <p class="header-subtitle" v-if="selectedTableId">数据库: {{ currentDatabaseName }}</p>
        </div>
        <div class="header-actions">
          <select v-model="selectedProjectId" @change="loadPromptTables" class="form-select">
            <option value="">选择项目</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
          <select v-model="selectedTableId" @change="loadPrompts" :disabled="!selectedProjectId" class="form-select">
            <option value="">选择提示词表</option>
            <option v-for="table in promptTables" :key="table.id" :value="table.id">
              {{ table.name }}
            </option>
          </select>
          <button class="btn btn-primary btn-large" @click="showCreateModal = true" :disabled="!selectedTableId">
            <span class="btn-icon">+</span>
            新建提示词
          </button>
          <div class="view-toggle">
            <button
              @click="viewMode = 'card'"
              :class="['btn', 'btn-view', { active: viewMode === 'card' }]"
              title="卡片视图"
            >
              卡片
            </button>
            <button
              @click="viewMode = 'table'"
              :class="['btn', 'btn-view', { active: viewMode === 'table' }]"
              title="表格视图"
            >
              表格
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error">
      <div class="error-card">
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button @click="clearError" class="btn btn-secondary">重试</button>
      </div>
    </div>

    <div v-else-if="!selectedProjectId" class="empty-state">
      <h3>请选择项目</h3>
      <p>请选择一个项目来管理提示词</p>
    </div>
    
    <div v-else-if="promptTables.length === 0" class="empty-state">
      <h3>暂无提示词表</h3>
      <p>该项目还没有提示词表，请先创建提示词表</p>
    </div>
    
    <div v-else-if="!selectedTableId" class="empty-state">
      <h3>请选择提示词表</h3>
      <p>请选择一个提示词表来管理提示词</p>
    </div>

    <div v-else>
      <div class="search-bar">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜索提示词..."
          class="search-input"
          @input="filterPrompts"
        />
        <button class="btn btn-secondary search-btn" @click="filterPrompts">
          <span class="btn-icon">⚲</span>
          搜索
        </button>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="card-view-container">
        <div class="prompt-list">
          <div
            v-for="prompt in paginatedPrompts"
            :key="prompt.id"
            class="prompt-card"
            @click="editPrompt(prompt)"
          >
            <div class="prompt-card-inner">
              <div class="prompt-header">
                <div class="prompt-title">
                  <h3>{{ truncateText(prompt.title, 30) }}</h3>
                  <span class="prompt-badge" :class="{ active: prompt.is_active }">
                    {{ prompt.is_active ? '激活' : '未激活' }}
                  </span>
                </div>
                <div class="prompt-meta">
                  <span class="prompt-code">{{ truncateText(prompt.code, 15) }}</span>
                  <span class="prompt-version">v{{ prompt.version }}</span>
                </div>
              </div>
              <div class="prompt-content">
                <p>{{ truncateText(prompt.content, 80) }}</p>
              </div>
              <div class="prompt-footer">
                <span v-if="prompt.tags" class="tags">{{ truncateText(prompt.tags, 20) }}</span>
                <span class="date">{{ formatDate(prompt.updated_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页组件 -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            @click="currentPage = 1"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            首页
          </button>
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            上一页
          </button>
          <span class="pagination-info">
            第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
          </span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            下一页
          </button>
          <button
            @click="currentPage = totalPages"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            末页
          </button>
        </div>
      </div>

      <!-- 表格视图 -->
      <div v-else-if="viewMode === 'table'" class="prompt-table-container">
        <div class="table-header">
          <div class="table-title">提示词列表</div>
          <div class="table-stats">
            共 {{ filteredPrompts.length }} 条提示词
          </div>
        </div>
        
        <div class="table-wrapper">
          <div class="two-column-layout">
            <!-- 左列表格 -->
            <div class="table-column left-column">
              <div class="column-header">
                <span class="column-title">列表 1-10</span>
              </div>
              <table class="compact-table">
                <thead>
                  <tr>
                    <th @click="sortByField('title')" :class="{ sortable: true, active: sortField === 'title' }">
                      标题
                      <span class="sort-indicator" v-if="sortField === 'title'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('code')" :class="{ sortable: true, active: sortField === 'code' }">
                      代码
                      <span class="sort-indicator" v-if="sortField === 'code'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('version')" :class="{ sortable: true, active: sortField === 'version' }">
                      版本
                      <span class="sort-indicator" v-if="sortField === 'version'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('is_active')" :class="{ sortable: true, active: sortField === 'is_active' }">
                      状态
                      <span class="sort-indicator" v-if="sortField === 'is_active'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('tags')" :class="{ sortable: true, active: sortField === 'tags' }">
                      标签
                      <span class="sort-indicator" v-if="sortField === 'tags'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('updated_at')" :class="{ sortable: true, active: sortField === 'updated_at' }">
                      更新时间
                      <span class="sort-indicator" v-if="sortField === 'updated_at'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="prompt in leftColumnPrompts" :key="prompt.id" class="compact-row" @click="editPrompt(prompt)">
                    <td class="compact-title">{{ truncateText(prompt.title, 20) }}</td>
                    <td class="compact-code">{{ prompt.code }}</td>
                    <td class="compact-version">v{{ prompt.version }}</td>
                    <td class="compact-status" @click.stop>
                      <div class="compact-status-toggle">
                        <input
                          :id="`status-left-${prompt.id}`"
                          type="checkbox"
                          :checked="prompt.is_active"
                          @change="togglePromptStatus(prompt)"
                        />
                        <label :for="`status-left-${prompt.id}`" class="compact-toggle-label">
                          <span class="compact-toggle-slider"></span>
                        </label>
                      </div>
                    </td>
                    <td class="compact-tags">{{ truncateText(prompt.tags || '-', 15) }}</td>
                    <td class="compact-date">{{ formatDate(prompt.updated_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- 右列表格 -->
            <div class="table-column right-column">
              <div class="column-header">
                <span class="column-title">列表 11-20</span>
              </div>
              <table class="compact-table">
                <thead>
                  <tr>
                    <th @click="sortByField('title')" :class="{ sortable: true, active: sortField === 'title' }">
                      标题
                      <span class="sort-indicator" v-if="sortField === 'title'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('code')" :class="{ sortable: true, active: sortField === 'code' }">
                      代码
                      <span class="sort-indicator" v-if="sortField === 'code'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('version')" :class="{ sortable: true, active: sortField === 'version' }">
                      版本
                      <span class="sort-indicator" v-if="sortField === 'version'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('is_active')" :class="{ sortable: true, active: sortField === 'is_active' }">
                      状态
                      <span class="sort-indicator" v-if="sortField === 'is_active'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('tags')" :class="{ sortable: true, active: sortField === 'tags' }">
                      标签
                      <span class="sort-indicator" v-if="sortField === 'tags'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByField('updated_at')" :class="{ sortable: true, active: sortField === 'updated_at' }">
                      更新时间
                      <span class="sort-indicator" v-if="sortField === 'updated_at'">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="prompt in rightColumnPrompts" :key="prompt.id" class="compact-row" @click="editPrompt(prompt)">
                    <td class="compact-title">{{ truncateText(prompt.title, 20) }}</td>
                    <td class="compact-code">{{ prompt.code }}</td>
                    <td class="compact-version">v{{ prompt.version }}</td>
                    <td class="compact-status" @click.stop>
                      <div class="compact-status-toggle">
                        <input
                          :id="`status-right-${prompt.id}`"
                          type="checkbox"
                          :checked="prompt.is_active"
                          @change="togglePromptStatus(prompt)"
                        />
                        <label :for="`status-right-${prompt.id}`" class="compact-toggle-label">
                          <span class="compact-toggle-slider"></span>
                        </label>
                      </div>
                    </td>
                    <td class="compact-tags">{{ truncateText(prompt.tags || '-', 15) }}</td>
                    <td class="compact-date">{{ formatDate(prompt.updated_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <!-- 表格视图分页组件 -->
        <div v-if="viewMode === 'table' && totalPages > 1" class="table-pagination">
          <div class="pagination-info">
            显示第 {{ (currentPage - 1) * tablePageSize + 1 }} - {{ Math.min(currentPage * tablePageSize, filteredPrompts.length) }} 条，共 {{ filteredPrompts.length }} 条
          </div>
          <div class="pagination-controls">
            <button
              @click="currentPage = 1"
              :disabled="currentPage === 1"
              class="pagination-btn"
            >
              首页
            </button>
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="pagination-btn"
            >
              上一页
            </button>
            <div class="page-numbers">
              <button
                v-for="page in getPageNumbers()"
                :key="page"
                @click="currentPage = page"
                :class="['page-number', { active: currentPage === page }]"
              >
                {{ page }}
              </button>
            </div>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="pagination-btn"
            >
              下一页
            </button>
            <button
              @click="currentPage = totalPages"
              :disabled="currentPage === totalPages"
              class="pagination-btn"
            >
              末页
            </button>
          </div>
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
          <p>确定要删除提示词 "{{ deletingPrompt?.title }}" 吗？此操作不可撤销。</p>
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

    <!-- 创建/编辑提示词模态框 -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title-section">
            <h3>{{ editingPrompt ? '编辑提示词' : '新建提示词' }}</h3>
            <p class="modal-subtitle">{{ editingPrompt ? '修改现有提示词的内容和属性' : '创建一个新的提示词' }}</p>
          </div>
          <button class="modal-close" @click="closeModal">
            <span class="close-icon">×</span>
          </button>
        </div>
        <form @submit.prevent="savePrompt" class="edit-form">
          <div class="form-layout">
            <!-- 左侧信息栏 -->
            <div class="form-sidebar">
              <div class="form-group">
                <label for="code">代码标识</label>
                <div class="input-wrapper">
                  <input
                    id="code"
                    v-model="promptForm.code"
                    type="text"
                    required
                    placeholder="输入提示词代码标识"
                    class="form-input"
                  />
                  <div class="input-icon">#</div>
                </div>
              </div>
              <div class="form-group">
                <label for="title">标题</label>
                <div class="input-wrapper">
                  <input
                    id="title"
                    v-model="promptForm.title"
                    type="text"
                    required
                    placeholder="输入提示词标题"
                    class="form-input"
                  />
                  <div class="input-icon">T</div>
                </div>
              </div>
              <div class="form-group">
                <label for="version">版本号</label>
                <div class="input-wrapper">
                  <input
                    id="version"
                    v-model="promptForm.version"
                    type="text"
                    required
                    placeholder="输入版本号"
                    class="form-input"
                  />
                  <div class="input-icon">v</div>
                </div>
              </div>
              <div class="form-group">
                <label for="project">所属项目</label>
                <div class="input-wrapper">
                  <select
                    id="project"
                    v-model="selectedProjectId"
                    disabled
                    class="form-select project-select"
                  >
                    <option value="">选择项目</option>
                    <option v-for="project in projects" :key="project.id" :value="project.id">
                      {{ project.name }}
                    </option>
                  </select>
                  <div class="input-icon">☰</div>
                </div>
              </div>
              <div class="form-group">
                <label for="tags">标签</label>
                <div class="input-wrapper">
                  <input
                    id="tags"
                    v-model="promptForm.tags"
                    type="text"
                    placeholder="输入标签，用逗号分隔"
                    class="form-input"
                  />
                  <div class="input-icon">⚑</div>
                </div>
              </div>
              <div class="form-group">
                <label>激活状态</label>
                <div class="status-toggle">
                  <input
                    id="form-status"
                    type="checkbox"
                    v-model="promptForm.is_active"
                  />
                  <label for="form-status" class="toggle-label">
                    <span class="toggle-slider"></span>
                    <span class="toggle-text">{{ promptForm.is_active ? '激活' : '未激活' }}</span>
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label for="description">备注</label>
                <textarea
                  id="description"
                  v-model="promptForm.description"
                  placeholder="输入备注信息..."
                  rows="3"
                  class="description-textarea"
                ></textarea>
              </div>
              <div class="form-group" v-if="editingPrompt">
                <label>修改时间</label>
                <div class="info-text">{{ formatDate(editingPrompt.updated_at) }}</div>
              </div>
            </div>
            
            <!-- 右侧内容编辑区 -->
            <div class="form-content">
              <div class="content-header">
                <h4 class="content-title">提示词内容</h4>
                <div class="content-actions">
                  <button type="button" class="clear-button" @click="clearContent" title="清空内容">
                    <span class="button-icon">×</span>
                    清空
                  </button>
                </div>
                <div class="content-stats">
                  <span class="char-count">{{ promptForm.content.length }} 字符</span>
                  <span class="word-count">{{ promptForm.content.split(/\s+/).filter(word => word.length > 0).length }} 词</span>
                </div>
              </div>
              <div class="content-editor">
                <textarea
                  id="content"
                  v-model="promptForm.content"
                  required
                  placeholder="输入提示词内容..."
                  class="content-textarea"
                ></textarea>
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-small btn-secondary">
              <span class="btn-icon">×</span>
              取消
            </button>
            <button v-if="editingPrompt" type="button" @click="confirmDeletePrompt(editingPrompt)" class="btn btn-small btn-danger">
              <span class="btn-icon">⊗</span>
              删除
            </button>
            <button type="submit" class="btn btn-small btn-primary" :disabled="!promptForm.code || !promptForm.title">
              <span class="btn-icon">✓</span>
              {{ editingPrompt ? '更新' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 查看提示词模态框 -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>{{ viewingPrompt?.title }}</h3>
          <button class="modal-close" @click="closeViewModal">×</button>
        </div>
        <div class="prompt-details">
          <div class="detail-item">
            <strong>代码标识:</strong> {{ viewingPrompt?.code }}
          </div>
          <div class="detail-item">
            <strong>版本:</strong> {{ viewingPrompt?.version }}
          </div>
          <div class="detail-item">
            <strong>状态:</strong>
            <div class="status-toggle">
              <input
                :id="`view-status-${viewingPrompt?.id}`"
                type="checkbox"
                :checked="viewingPrompt?.is_active"
                @change="togglePromptStatus(viewingPrompt)"
              />
              <label :for="`view-status-${viewingPrompt?.id}`" class="toggle-label">
                <span class="toggle-slider"></span>
                <span class="toggle-text">{{ viewingPrompt?.is_active ? '激活' : '未激活' }}</span>
              </label>
            </div>
          </div>
          <div class="detail-item">
            <strong>标签:</strong> {{ viewingPrompt?.tags || '无' }}
          </div>
          <div class="detail-item">
            <div class="content-toolbar">
              <button class="copy-button" @click="copyContent" :class="{ copied: copySuccess }">
                {{ copySuccess ? '已复制!' : '复制内容' }}
              </button>
            </div>
            <strong>内容:</strong>
            <pre class="content-display">{{ viewingPrompt?.content }}</pre>
          </div>
        </div>
        <div class="form-actions">
          <button @click="closeViewModal" class="btn btn-secondary">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '@/stores/api'
import type { Project, Prompt } from '@/types'

const projects = ref<Project[]>([])
const prompts = ref<Prompt[]>([])
const filteredPrompts = ref<Prompt[]>([])
const promptTables = ref<any[]>([])
const selectedProjectId = ref('')
const selectedTableId = ref('')
const currentDatabaseName = ref('')
const searchQuery = ref('')
const viewMode = ref<'card' | 'table'>('table')
const sortField = ref<keyof Prompt>('updated_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const loading = ref(false)
const error = ref<string | null>(null)

// 分页相关
const currentPage = ref(1)
const cardPageSize = ref(12) // 卡片视图每页显示12个卡片，3行4列
const tablePageSize = ref(20) // 表格视图每页显示20条数据，左列10条，右列10条

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const editingPrompt = ref<Prompt | null>(null)
const viewingPrompt = ref<Prompt | null>(null)
const deletingPrompt = ref<Prompt | null>(null)

const promptForm = ref({
  code: '',
  title: '',
  content: '',
  tags: '',
  version: '1.0.0',
  description: '',
  is_active: true
})

const copySuccess = ref(false)

onMounted(async () => {
  try {
    projects.value = await api.get('/projects')
  } catch (err) {
    error.value = (err as Error).message
  }
})

const loadPromptTables = async () => {
  if (!selectedProjectId.value) {
    promptTables.value = []
    selectedTableId.value = ''
    prompts.value = []
    return
  }
  
  loading.value = true
  error.value = null
  try {
    promptTables.value = await api.get(`/projects/${selectedProjectId.value}/prompt-tables`)
    selectedTableId.value = ''
    prompts.value = []
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

const loadPrompts = async () => {
  if (!selectedTableId.value) return
  
  loading.value = true
  error.value = null
  try {
    prompts.value = await api.get(`/prompts?tableId=${selectedTableId.value}`)
    filteredPrompts.value = [...prompts.value]
    
    // 获取当前表的信息，包括数据库名称
    const currentTable = promptTables.value.find(table => table.id === selectedTableId.value)
    if (currentTable) {
      currentDatabaseName.value = currentTable.table_name || currentTable.name
    }
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

const filterPrompts = () => {
  if (!searchQuery.value.trim()) {
    filteredPrompts.value = [...prompts.value]
  } else {
    const query = searchQuery.value.toLowerCase()
    filteredPrompts.value = prompts.value.filter(prompt =>
      prompt.title.toLowerCase().includes(query) ||
      prompt.code.toLowerCase().includes(query) ||
      prompt.content.toLowerCase().includes(query) ||
      (prompt.tags && prompt.tags.toLowerCase().includes(query))
    )
  }
  // 重置到第一页
  currentPage.value = 1
}

const sortedPrompts = computed(() => {
  const result = [...filteredPrompts.value]
  result.sort((a, b) => {
    let aValue = a[sortField.value]
    let bValue = b[sortField.value]
    
    // 处理undefined值
    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return sortOrder.value === 'asc' ? 1 : -1
    if (bValue === undefined) return sortOrder.value === 'asc' ? -1 : 1
    
    // 处理字符串比较
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
  return result
})

// 计算分页数据
const totalPages = computed(() => {
  const pageSize = viewMode.value === 'table' ? tablePageSize.value : cardPageSize.value
  return Math.ceil(filteredPrompts.value.length / pageSize)
})

const paginatedPrompts = computed(() => {
  const pageSize = viewMode.value === 'table' ? tablePageSize.value : cardPageSize.value
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return sortedPrompts.value.slice(start, end)
})

const sortByField = (field: keyof Prompt) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

// 获取左列的提示词数据
const leftColumnPrompts = computed(() => {
  if (viewMode.value === 'table') {
    // 表格视图：每页前10条显示在左列
    const start = (currentPage.value - 1) * tablePageSize.value
    const end = start + 10 // 左列固定显示10条
    return sortedPrompts.value.slice(start, end)
  } else {
    // 卡片视图不使用此计算属性
    return []
  }
})

// 获取右列的提示词数据
const rightColumnPrompts = computed(() => {
  if (viewMode.value === 'table') {
    // 表格视图：每页后10条显示在右列
    const start = (currentPage.value - 1) * tablePageSize.value + 10 // 右列从第11条开始
    const end = start + 10 // 右列固定显示10条
    return sortedPrompts.value.slice(start, end)
  } else {
    // 卡片视图不使用此计算属性
    return []
  }
})


const editPrompt = (prompt: Prompt) => {
  editingPrompt.value = prompt
  promptForm.value = {
    code: prompt.code,
    title: prompt.title,
    content: prompt.content,
    tags: prompt.tags || '',
    version: prompt.version,
    description: (prompt as any).description || '',
    is_active: prompt.is_active
  }
  showEditModal.value = true
}

const confirmDeletePrompt = (prompt: Prompt) => {
  deletingPrompt.value = prompt
  showDeleteModal.value = true
}

const executeDelete = async () => {
  if (!deletingPrompt.value) return
  
  try {
    await api.delete(`/prompts/${deletingPrompt.value.id}`)
    prompts.value = prompts.value.filter(p => p.id !== deletingPrompt.value!.id)
    filteredPrompts.value = filteredPrompts.value.filter(p => p.id !== deletingPrompt.value!.id)
    closeDeleteModal()
  } catch (err) {
    alert('删除失败: ' + (err as Error).message)
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deletingPrompt.value = null
}

const savePrompt = async () => {
  try {
    const data = {
      ...promptForm.value,
      table_id: selectedTableId.value
    }
    
    // 检查是否为编辑模式
    if (editingPrompt.value) {
      await api.put(`/prompts/${editingPrompt.value.id}`, data)
      await loadPrompts()
    } else {
      // 在创建新提示词前，检查同一表中是否已存在相同代码
      const existingPrompt = prompts.value.find(p =>
        p.table_id === selectedTableId.value &&
        p.code.toLowerCase() === promptForm.value.code.toLowerCase()
      )
      
      if (existingPrompt) {
        alert('保存失败: 该提示词表已存在相同的代码标识，请使用不同的代码标识')
        return
      }
      
      await api.post('/prompts', data)
      await loadPrompts()
    }
    closeModal()
  } catch (err) {
    alert('保存失败: ' + (err as Error).message)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingPrompt.value = null
  promptForm.value = {
    code: '',
    title: '',
    content: '',
    tags: '',
    version: '1.0.0',
    description: '',
    is_active: true
  }
}

const closeViewModal = () => {
  showViewModal.value = false
  viewingPrompt.value = null
}

const clearError = () => {
  error.value = null
}

const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const togglePromptStatus = async (prompt: Prompt | null) => {
  if (!prompt) return
  
  try {
    const newStatus = !prompt.is_active
    await api.put(`/prompts/${prompt.id}`, { ...prompt, is_active: newStatus })
    prompt.is_active = newStatus
  } catch (err) {
    alert('状态更新失败: ' + (err as Error).message)
    // 恢复原始状态
    const leftCheckbox = document.getElementById(`status-left-${prompt.id}`) as HTMLInputElement
    const rightCheckbox = document.getElementById(`status-right-${prompt.id}`) as HTMLInputElement
    if (leftCheckbox) {
      leftCheckbox.checked = prompt.is_active
    }
    if (rightCheckbox) {
      rightCheckbox.checked = prompt.is_active
    }
  }
}

const clearContent = () => {
  if (confirm('确定要清空内容吗？')) {
    promptForm.value.content = ''
  }
}

const formatContent = () => {
  // 简单的格式化：去除多余空行，确保段落间有适当空行
  let content = promptForm.value.content
    .replace(/\n{3,}/g, '\n\n') // 将3个或更多连续换行符替换为2个
    .replace(/^\s+|\s+$/g, '') // 去除首尾空白
    .replace(/\n\s*\n/g, '\n\n') // 确保段落间只有一个空行
  
  promptForm.value.content = content
}

const copyContent = async () => {
  if (viewingPrompt.value?.content) {
    try {
      await navigator.clipboard.writeText(viewingPrompt.value.content)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
      alert('复制失败，请手动复制')
    }
  }
}

const getPageNumbers = () => {
  const pages = []
  const maxVisiblePages = 5
  const startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1)
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return pages
}
</script>

<style scoped>
.prompts {
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

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.form-select {
  padding: 0.625rem 1.25rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.btn-large {
  padding: 0.625rem 1.25rem;
  font-size: 0.9rem;
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.search-input:focus {
  outline: none;
  border-color: #1976D2;
  background: white;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.search-btn {
  white-space: nowrap;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.btn-view {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
  border-radius: 6px;
  background: #f8f9fa;
  color: #6c757d;
  border: 2px solid #e9ecef;
  transition: all 0.2s ease;
}

.btn-view:hover {
  background: #e9ecef;
  color: #495057;
  transform: translateY(-1px);
}

.btn-view.active {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  border-color: #1976D2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.25);
}

.prompt-table-container {
  margin-top: 0.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #e9ecef;
}

.table-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.table-stats {
  font-size: 0.9rem;
  color: #6c757d;
  background: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.table-wrapper {
  padding: 0;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.table-column {
  border-right: 1px solid #e9ecef;
}

.table-column:last-child {
  border-right: none;
}

.column-header {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  text-align: center;
}

.column-title {
  font-weight: 600;
  color: #495057;
  font-size: 0.85rem;
}

.compact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.compact-table th,
.compact-table td {
  padding: 0.4rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.compact-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 0.75rem;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.compact-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.compact-table th.sortable:hover {
  background-color: #e9ecef;
}

.compact-table th.active {
  background-color: #E3F2FD;
  color: #1976D2;
}

.sort-indicator {
  margin-left: 0.25rem;
  font-size: 0.7rem;
}

.compact-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.compact-row:hover {
  background-color: #f8f9fa;
}

.compact-row:nth-child(even) {
  background-color: #fafafa;
}

.compact-row:nth-child(even):hover {
  background-color: #f0f0f0;
}

.compact-title {
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-code {
  font-family: monospace;
  font-size: 0.75rem;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-version {
  color: #6c757d;
  font-size: 0.7rem;
  white-space: nowrap;
}

.compact-status {
  width: 60px;
  text-align: center;
}

.compact-status-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 0.25rem 0;
}

.compact-status-toggle input[type="checkbox"] {
  display: none;
}

.compact-toggle-label {
  cursor: pointer;
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: center;
}

.compact-toggle-slider {
  position: relative;
  width: 32px;
  height: 18px;
  background-color: #ccc;
  border-radius: 18px;
  transition: background-color 0.3s;
  flex-shrink: 0;
}

.compact-toggle-slider::before {
  content: "";
  position: absolute;
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.compact-status-toggle input[type="checkbox"]:checked + .compact-toggle-label .compact-toggle-slider {
  background-color: #4caf50;
}

.compact-status-toggle input[type="checkbox"]:checked + .compact-toggle-label .compact-toggle-slider::before {
  transform: translateX(14px);
}

.compact-tags {
  font-size: 0.75rem;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-date {
  color: #6c757d;
  font-size: 0.7rem;
  white-space: nowrap;
}

.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.pagination-info {
  font-size: 0.85rem;
  color: #6c757d;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  padding: 0.3rem 0.5rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 28px;
  text-align: center;
}

.page-number:hover {
  background: #e9ecef;
  border-color: #1976D2;
}

.page-number.active {
  background: #1976D2;
  color: white;
  border-color: #1976D2;
}

.loading, .error, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-size: 1rem;
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

.error-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e74c3c;
  max-width: 400px;
  text-align: center;
}

.error-card h3 {
  margin: 0 0 1rem 0;
  color: #e74c3c;
  font-size: 1.3rem;
}

.error-card p {
  margin: 0 0 1.5rem 0;
  color: #6c757d;
  line-height: 1.5;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #e74c3c;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
  color: #6c757d;
  font-weight: bold;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 2rem 0;
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.5;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.card-view-container {
  background: transparent;
  padding: 0;
}

.prompt-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.prompt-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  position: relative;
}

.prompt-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #e0e0e0;
}

.prompt-card-inner {
  padding: 1.25rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.prompt-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.prompt-title h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.2;
}

.prompt-badge {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prompt-badge.active {
  background: linear-gradient(135deg, #28a745, #218838);
}

.prompt-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.prompt-code {
  background: #f8f9fa;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.7rem;
  color: #6c757d;
}

.prompt-version {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
}

.prompt-content {
  margin-bottom: 0.75rem;
  flex: 1;
}

.prompt-content p {
  margin: 0;
  color: #555;
  line-height: 1.4;
  font-size: 0.85rem;
}

.prompt-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  gap: 0.5rem;
}

.status-toggle {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
}

.status-toggle input[type="checkbox"] {
  display: none;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 0.25rem 0;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: #ccc;
  border-radius: 24px;
  transition: background-color 0.3s;
  margin-right: 8px;
  flex-shrink: 0;
  display: block;
}

.toggle-slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.toggle-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6c757d;
  transition: color 0.3s;
}

.status-toggle input[type="checkbox"]:checked + .toggle-label .toggle-slider {
  background-color: #4caf50;
}

.status-toggle input[type="checkbox"]:checked + .toggle-label .toggle-slider::before {
  transform: translateX(20px);
}

.status-toggle input[type="checkbox"]:checked + .toggle-label .toggle-text {
  color: #155724;
}

.tags {
  background: #fff3cd;
  color: #856404;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
}

.date {
  color: #6c757d;
  font-size: 0.7rem;
}

.prompt-actions {
  display: flex;
  gap: 0.3rem;
  justify-content: flex-end;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
  display: flex;
  flex-direction: column;
}

.modal-large {
  max-width: 1200px;
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
  align-items: flex-start;
  padding: 1rem 2rem; /* 减少头部高度 */
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.modal-title-section h3 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 700;
}

.modal-subtitle {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 400;
}

.modal-close {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-top: -0.5rem;
}

.close-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.modal-close:hover {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-group textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.5;
  min-height: 400px;
  resize: vertical;
  transition: all 0.2s ease;
}

.form-group textarea:focus {
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.textarea-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px 4px 0 0;
  border: 1px solid #ddd;
  border-bottom: none;
}

.toolbar-buttons {
  display: flex;
  gap: 0.5rem;
}

.toolbar-button {
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
}

.toolbar-button:hover {
  background: #e9ecef;
  border-color: #1976D2;
  color: #1976D2;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button-icon {
  font-size: 0.9rem;
}

.char-count {
  font-size: 0.8rem;
  color: #6c757d;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 2rem 1.5rem 2rem; /* 增加底部内边距，防止按钮贴着框底 */
  border-top: 1px solid #e9ecef;
  background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,1));
  flex-shrink: 0; /* 防止按钮区域被压缩 */
  backdrop-filter: blur(8px);
  margin-top: auto; /* 确保按钮区域始终在底部 */
  min-height: 60px; /* 设置最小高度，确保按钮有足够空间 */
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

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-icon {
  font-size: 1rem;
  font-weight: normal;
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

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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

.prompt-details {
  margin-bottom: 1rem;
}

.detail-item {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.content-display {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 1rem;
  line-height: 1.6;
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.edit-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(90vh - 80px); /* 减去头部和底部按钮区域的高度 */
}

.form-layout {
  display: flex;
  gap: 2rem;
  flex: 1;
  overflow: hidden;
  padding: 1.5rem 2rem;
  min-height: 0; /* 允许flex子项收缩 */
}

.form-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  padding: 0 1.5rem 0 0;
  border-right: 1px solid #e9ecef;
  overflow-y: auto;
  min-height: 0; /* 允许flex子项收缩 */
  padding-bottom: 1rem; /* 确保底部有足够空间 */
  max-height: calc(90vh - 160px); /* 限制最大高度，确保可以滚动 */
}



.input-wrapper {
  position: relative;
  margin-bottom: 0.5rem;
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: bold;
  pointer-events: none;
  background: #f8f9fa;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-content {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0; /* 允许flex子项收缩 */
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  position: relative;
  gap: 1rem; /* 添加间距防止重叠 */
}

.content-title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.content-icon {
  font-size: 1.2rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #28a745, #218838);
  color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
}

.content-title {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 700;
}

.content-actions {
  flex-shrink: 0; /* 防止被压缩 */
  margin-left: auto; /* 推到右侧 */
}

.content-stats {
  display: flex;
  gap: 1rem;
  flex-shrink: 0; /* 防止被压缩 */
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 1rem;
}

.char-count, .word-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

.content-editor {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许flex子项收缩 */
  overflow: hidden;
}

.content-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许flex子项收缩 */
  overflow: hidden;
}

.content-textarea {
  flex: 1;
  min-height: 450px; /* 进一步增加最小高度 */
  resize: none;
  width: 100%;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem; /* 增加内边距 */
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 1.05rem; /* 进一步增加字体大小 */
  line-height: 1.7; /* 增加行高 */
  transition: all 0.2s ease;
  overflow-y: auto; /* 允许文本区域滚动 */
  background: #fafafa;
}

.content-textarea:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.clear-button {
  padding: 0.4rem 0.8rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #6c757d;
}

.clear-button:hover {
  background: #e9ecef;
  border-color: #dc3545;
  color: #dc3545;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.description-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.project-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #f8f9fa;
  color: #6c757d;
}

.info-text {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #6c757d;
  font-size: 0.9rem;
}

.content-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px 4px 0 0;
  border: 1px solid #e9ecef;
  border-bottom: none;
}

.copy-button {
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.copy-button:hover {
  background: #e9ecef;
  border-color: #1976D2;
}

.copy-button.copied {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
}

.pagination-btn {
  padding: 0.4rem 0.8rem;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  min-width: 60px;
}

.pagination-btn:hover:not(:disabled) {
  background: #1565C0;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.pagination-btn:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.pagination-info {
  padding: 0 1rem;
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
}

@media (max-width: 768px) {
  .prompts {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .prompt-list {
    grid-template-columns: 1fr;
  }
  
  .modal {
    width: 95%;
  }
}
</style>