<template>
  <div class="prompts">
    <div class="header">
      <div class="header-left">
        <h2>提示词管理</h2>
        <div class="database-info" v-if="selectedTableId">
          <span class="database-name">数据库: {{ currentDatabaseName }}</span>
        </div>
      </div>
      <div class="header-actions">
        <select v-model="selectedProjectId" @change="loadPromptTables">
          <option value="">选择项目</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
        <select v-model="selectedTableId" @change="loadPrompts" :disabled="!selectedProjectId">
          <option value="">选择提示词表</option>
          <option v-for="table in promptTables" :key="table.id" :value="table.id">
            {{ table.name }}
          </option>
        </select>
        <button class="btn btn-primary" @click="showCreateModal = true" :disabled="!selectedTableId">
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

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="clearError" class="btn btn-secondary">重试</button>
    </div>

    <div v-else-if="!selectedProjectId" class="empty-state">
      请选择一个项目来管理提示词
    </div>
    
    <div v-else-if="promptTables.length === 0" class="empty-state">
      该项目还没有提示词表，请先创建提示词表
    </div>
    
    <div v-else-if="!selectedTableId" class="empty-state">
      请选择一个提示词表来管理提示词
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
            <div class="prompt-header">
              <h3>{{ truncateText(prompt.title, 30) }}</h3>
              <span class="prompt-code">{{ truncateText(prompt.code, 15) }}</span>
              <span class="prompt-version">v{{ prompt.version }}</span>
            </div>
            <div class="prompt-content">
              <p>{{ truncateText(prompt.content, 80) }}</p>
            </div>
            <div class="prompt-meta">
              <span :class="['status', prompt.is_active ? 'active' : 'inactive']">
                {{ prompt.is_active ? '激活' : '未激活' }}
              </span>
              <span v-if="prompt.tags" class="tags">{{ truncateText(prompt.tags, 20) }}</span>
              <span class="date">{{ formatDate(prompt.updated_at) }}</span>
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
        <div class="two-column-layout">
          <div class="table-column left-column">
            <table class="prompt-table">
              <thead>
                <tr>
                  <th @click="sortByField('title')" :class="{ sortable: true, active: sortField === 'title' }">
                    标题
                    <span class="sort-indicator" v-if="sortField === 'title'">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                  <th @click="sortByField('code')" :class="{ sortable: true, active: sortField === 'code' }">
                    代码标识
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
                <tr v-for="prompt in leftColumnPrompts" :key="prompt.id" class="prompt-row" @click="editPrompt(prompt)">
                  <td class="prompt-title">{{ prompt.title }}</td>
                  <td class="prompt-code">{{ prompt.code }}</td>
                  <td class="prompt-version">v{{ prompt.version }}</td>
                  <td class="prompt-status" @click.stop>
                    <div class="status-toggle">
                      <input
                        :id="`status-${prompt.id}`"
                        type="checkbox"
                        :checked="prompt.is_active"
                        @change="togglePromptStatus(prompt)"
                      />
                      <label :for="`status-${prompt.id}`" class="toggle-label">
                        <span class="toggle-slider"></span>
                        <span class="toggle-text">{{ prompt.is_active ? '激活' : '未激活' }}</span>
                      </label>
                    </div>
                  </td>
                  <td class="prompt-tags">{{ prompt.tags || '-' }}</td>
                  <td class="prompt-date">{{ formatDate(prompt.updated_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="table-column right-column">
            <table class="prompt-table">
              <thead>
                <tr>
                  <th @click="sortByField('title')" :class="{ sortable: true, active: sortField === 'title' }">
                    标题
                    <span class="sort-indicator" v-if="sortField === 'title'">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                  <th @click="sortByField('code')" :class="{ sortable: true, active: sortField === 'code' }">
                    代码标识
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
                <tr v-for="prompt in rightColumnPrompts" :key="prompt.id" class="prompt-row" @click="editPrompt(prompt)">
                  <td class="prompt-title">{{ prompt.title }}</td>
                  <td class="prompt-code">{{ prompt.code }}</td>
                  <td class="prompt-version">v{{ prompt.version }}</td>
                  <td class="prompt-status" @click.stop>
                    <div class="status-toggle">
                      <input
                        :id="`status-${prompt.id}`"
                        type="checkbox"
                        :checked="prompt.is_active"
                        @change="togglePromptStatus(prompt)"
                      />
                      <label :for="`status-${prompt.id}`" class="toggle-label">
                        <span class="toggle-slider"></span>
                        <span class="toggle-text">{{ prompt.is_active ? '激活' : '未激活' }}</span>
                      </label>
                    </div>
                  </td>
                  <td class="prompt-tags">{{ prompt.tags || '-' }}</td>
                  <td class="prompt-date">{{ formatDate(prompt.updated_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- 表格视图分页组件 -->
          <div v-if="viewMode === 'table' && totalPages > 1" class="pagination">
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
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal modal-small" @click.stop>
        <h3>确认删除</h3>
        <p>确定要删除提示词 "{{ deletingPrompt?.title }}" 吗？此操作不可撤销。</p>
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
        <h3>{{ editingPrompt ? '编辑提示词' : '新建提示词' }}</h3>
        <form @submit.prevent="savePrompt" class="edit-form">
          <div class="form-layout">
            <!-- 左侧信息栏 -->
            <div class="form-sidebar">
              <div class="form-group">
                <label for="code">代码标识</label>
                <input
                  id="code"
                  v-model="promptForm.code"
                  type="text"
                  required
                  placeholder="输入提示词代码标识"
                />
              </div>
              <div class="form-group">
                <label for="title">标题</label>
                <input
                  id="title"
                  v-model="promptForm.title"
                  type="text"
                  required
                  placeholder="输入提示词标题"
                />
              </div>
              <div class="form-group">
                <label for="version">版本号</label>
                <input
                  id="version"
                  v-model="promptForm.version"
                  type="text"
                  required
                  placeholder="输入版本号"
                />
              </div>
              <div class="form-group">
                <label for="project">所属项目</label>
                <select
                  id="project"
                  v-model="selectedProjectId"
                  disabled
                  class="project-select"
                >
                  <option value="">选择项目</option>
                  <option v-for="project in projects" :key="project.id" :value="project.id">
                    {{ project.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="tags">标签</label>
                <input
                  id="tags"
                  v-model="promptForm.tags"
                  type="text"
                  placeholder="输入标签，用逗号分隔"
                />
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
              <div class="form-group content-group">
                <label for="content">内容</label>
                <div class="textarea-toolbar">
                  <div class="toolbar-buttons">
                    <button type="button" class="toolbar-button" @click="clearContent" title="清空内容">
                      清空
                    </button>
                  </div>
                  <div class="char-count">
                    {{ promptForm.content.length }} 字符
                  </div>
                </div>
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
            <button type="button" @click="closeModal" class="btn btn-secondary">
              取消
            </button>
            <button v-if="editingPrompt" type="button" @click="confirmDeletePrompt(editingPrompt)" class="btn btn-danger">
              删除
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!promptForm.code || !promptForm.title">
              {{ editingPrompt ? '更新' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 查看提示词模态框 -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal modal-large" @click.stop>
        <h3>{{ viewingPrompt?.title }}</h3>
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
const pageSize = ref(12) // 每页显示12个卡片，3行4列

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
  return Math.ceil(filteredPrompts.value.length / pageSize.value)
})

const paginatedPrompts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
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
  // 表格视图不分页，使用所有数据
  const data = viewMode.value === 'table' ? filteredPrompts.value : sortedPrompts.value
  const halfLength = Math.ceil(data.length / 2)
  return data.slice(0, halfLength)
})

// 获取右列的提示词数据
const rightColumnPrompts = computed(() => {
  // 表格视图不分页，使用所有数据
  const data = viewMode.value === 'table' ? filteredPrompts.value : sortedPrompts.value
  const halfLength = Math.ceil(data.length / 2)
  return data.slice(halfLength)
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
    const checkbox = document.getElementById(`status-${prompt.id}`) as HTMLInputElement
    if (checkbox) {
      checkbox.checked = prompt.is_active
    }
  }
}

const clearContent = () => {
  if (confirm('确定要清空内容吗？')) {
    promptForm.value.content = ''
  }
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
</script>

<style scoped>
.prompts {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.database-info {
  display: flex;
  align-items: center;
}

.database-name {
  background-color: #E3F2FD;
  color: #1976D2;
  padding: 0.2rem 0.5rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.header-actions select {
  padding: 0.4rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-bar {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.search-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.search-btn {
  white-space: nowrap;
}

.view-toggle {
  display: flex;
  gap: 0.2rem;
  margin-left: 0.5rem;
}

.btn-view {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 4px;
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-view:hover {
  background: #e9ecef;
  color: #495057;
}

.btn-view.active {
  background: #1976D2;
  color: white;
  border-color: #1976D2;
}

.prompt-table-container {
  margin-top: 0.5rem;
}

.two-column-layout {
  display: flex;
  gap: 2rem;
  margin: 0 -1rem;
  padding: 1rem;
}

.table-column {
  flex: 1;
}

.left-column {
  margin-right: 1rem;
}

.right-column {
  margin-left: 1rem;
}

.prompt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.prompt-table th,
.prompt-table td {
  padding: 0.5rem 0.4rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.prompt-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  position: sticky;
  top: 0;
  z-index: 10;
  font-size: 0.8rem;
  white-space: nowrap;
}

.prompt-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.prompt-table th.sortable:hover {
  background-color: #e9ecef;
}

.prompt-table th.active {
  background-color: #E3F2FD;
  color: #1976D2;
}

.sort-indicator {
  margin-left: 0.5rem;
  font-size: 0.8rem;
}

.prompt-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.prompt-row:hover {
  background-color: #f8f9fa;
}

.prompt-title {
  font-weight: 500;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-code {
  font-family: monospace;
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-version {
  color: #6c757d;
  font-size: 0.75rem;
  max-width: 60px;
  white-space: nowrap;
}

.prompt-status {
  width: 70px;
  min-width: 70px;
}

.prompt-tags {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
}

.prompt-date {
  color: #6c757d;
  font-size: 0.75rem;
  white-space: nowrap;
  max-width: 90px;
}

.prompt-actions {
  white-space: nowrap;
  min-width: 150px;
}

.btn-sm {
  padding: 0.15rem 0.3rem;
  font-size: 0.7rem;
  margin-right: 0.15rem;
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

.card-view-container {
  background: transparent;
  padding: 0;
}

.prompt-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 1400px) {
  .prompt-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .prompt-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .prompt-list {
    grid-template-columns: 1fr;
  }
}

.prompt-card {
  background: white;
  border-radius: 8px;
  padding: 0.8rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.prompt-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.prompt-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 0.9rem;
  flex: 1;
  min-width: 0;
}

.prompt-code {
  background: #f8f9fa;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.7rem;
}

.prompt-version {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
}

.prompt-content {
  margin-bottom: 0.5rem;
  flex: 1;
}

.prompt-content p {
  margin: 0;
  color: #555;
  line-height: 1.4;
  font-size: 0.8rem;
}

.prompt-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.status-toggle {
  display: flex;
  align-items: center;
}

.status-toggle input[type="checkbox"] {
  display: none;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: #ccc;
  border-radius: 24px;
  transition: background-color 0.3s;
  margin-right: 8px;
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
}

.toggle-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6c757d;
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
  max-width: 1200px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-height: 95vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 1400px;
}

.modal h3 {
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

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
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
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.toolbar-button:hover {
  background: #e9ecef;
  border-color: #1976D2;
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
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  position: sticky;
  bottom: 0;
  background: white;
  padding-bottom: 1rem;
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
}

.form-layout {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  min-height: 500px;
}

.form-sidebar {
  flex: 1;
  max-width: 33.33%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 1rem;
  border-right: 1px solid #eee;
}

.form-content {
  flex: 2;
  display: flex;
  flex-direction: column;
}

.content-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-textarea {
  flex: 1;
  min-height: 400px;
  resize: none;
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

.modal-small {
  max-width: 400px;
}
</style>