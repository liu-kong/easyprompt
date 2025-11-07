<template>
  <div class="prompt-repository">
    <div class="header">
      <div class="header-content">
        <div class="header-text">
          <h2>提示词仓库</h2>
          <p class="header-subtitle">浏览和导入高质量的提示词模板</p>
        </div>
        <button class="btn btn-primary btn-large" @click="showImportModal = true">
          导入提示词
        </button>
      </div>
    </div>

    <div class="repository-content">
      <!-- 分类筛选 -->
      <div class="category-section">
        <h3>分类浏览</h3>
        <div class="category-grid">
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-card"
            :class="{ active: filters.category === category.id }"
            @click="selectCategory(category.id)"
          >
            <div class="category-icon">{{ category.icon }}</div>
            <div class="category-info">
              <h4>{{ category.name }}</h4>
              <p>{{ category.description }}</p>
              <span class="prompt-count">{{ category.prompt_count }} 个提示词</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <div class="search-bar">
          <input
            v-model="filters.search"
            type="text"
            placeholder="搜索提示词..."
            @input="handleSearch"
          />
          <button class="search-btn" @click="refresh">搜索</button>
        </div>
        
        <div class="filter-options">
          <select v-model="filters.sort_by" @change="handleSort">
            <option value="created_at">最新发布</option>
            <option value="updated_at">最近更新</option>
            <option value="usage_count">使用次数</option>
            <option value="rating">评分最高</option>
          </select>
          
          <select v-model="filters.sort_order" @change="handleSort">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
      </div>

      <!-- 视图切换 -->
      <div class="view-controls">
        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            网格视图
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            列表视图
          </button>
        </div>
      </div>

      <!-- 提示词列表 -->
      <div class="prompts-section">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="filteredPrompts.length === 0" class="empty-state">
          <p>没有找到匹配的提示词</p>
        </div>
        
        <!-- 网格视图 -->
        <div v-else-if="viewMode === 'grid'" class="prompts-grid">
          <div 
            v-for="prompt in filteredPrompts" 
            :key="prompt.id"
            class="prompt-card"
            @click="viewPrompt(prompt)"
          >
            <div class="prompt-header">
              <h4>{{ prompt.title }}</h4>
              <div class="prompt-meta">
                <span class="category">{{ getCategoryName(prompt.category) }}</span>
                <span class="rating">评分: {{ prompt.rating }}</span>
              </div>
            </div>
            <div class="prompt-content">
              <p>{{ prompt.description || prompt.content.substring(0, 100) + '...' }}</p>
            </div>
            <div class="prompt-footer">
              <div class="tags">
                <span v-for="tag in getTags(prompt.tags)" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>
              <div class="actions">
                <button @click.stop="copyPrompt(prompt)" class="action-btn">复制</button>
                <button @click.stop="addToProject(prompt)" class="action-btn primary">添加到项目</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 列表视图 -->
        <div v-else class="prompts-list">
          <div 
            v-for="prompt in filteredPrompts" 
            :key="prompt.id"
            class="prompt-list-item"
            @click="viewPrompt(prompt)"
          >
            <div class="prompt-info">
              <h4>{{ prompt.title }}</h4>
              <p>{{ prompt.description || prompt.content.substring(0, 150) + '...' }}</p>
              <div class="prompt-meta">
                <span class="category">{{ getCategoryName(prompt.category) }}</span>
                <span class="rating">评分: {{ prompt.rating }}</span>
                <span class="usage">使用 {{ prompt.usage_count }} 次</span>
                <div class="tags">
                  <span v-for="tag in getTags(prompt.tags)" :key="tag" class="tag">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            <div class="prompt-actions">
              <button @click.stop="copyPrompt(prompt)" class="action-btn">复制</button>
              <button @click.stop="addToProject(prompt)" class="action-btn primary">添加到项目</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button 
          @click="setPage(1)" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          首页
        </button>
        <button 
          @click="setPage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="setPage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          下一页
        </button>
        <button 
          @click="setPage(totalPages)" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          末页
        </button>
      </div>
    </div>

    <!-- 提示词详情模态框 -->
    <div v-if="selectedPrompt" class="modal-overlay" @click="closePromptModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedPrompt.title }}</h3>
          <button class="modal-close" @click="closePromptModal">×</button>
        </div>
        <div class="modal-body">
          <div class="prompt-details">
            <div class="detail-row">
              <span class="label">分类：</span>
              <span>{{ getCategoryName(selectedPrompt.category) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">作者：</span>
              <span>{{ selectedPrompt.author || '未知' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">版本：</span>
              <span>{{ selectedPrompt.version || '1.0' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">评分：</span>
              <span>{{ selectedPrompt.rating }}</span>
            </div>
            <div class="detail-row">
              <span class="label">使用次数：</span>
              <span>{{ selectedPrompt.usage_count }}</span>
            </div>
            <div class="detail-row">
              <span class="label">标签：</span>
              <div class="tags">
                <span v-for="tag in getTags(selectedPrompt.tags)" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>
            </div>
            <div class="detail-row">
              <span class="label">描述：</span>
              <span>{{ selectedPrompt.description || '无描述' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">内容：</span>
              <div class="prompt-content-display">
                <pre>{{ selectedPrompt.content }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button @click="copyPrompt(selectedPrompt)" class="btn btn-secondary">复制</button>
          <button @click="addToProject(selectedPrompt)" class="btn btn-primary">添加到项目</button>
        </div>
      </div>
    </div>

    <!-- 导入模态框 -->
    <div v-if="showImportModal" class="modal-overlay" @click="closeImportModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>导入提示词</h3>
          <button class="modal-close" @click="closeImportModal">×</button>
        </div>
        <div class="modal-body">
          <div class="import-options">
            <div class="import-option" @click="importFromFile">
              <h4>从文件导入</h4>
              <p>支持 JSON、TXT 格式</p>
            </div>
            <div class="import-option" @click="importFromUrl">
              <h4>从 URL 导入</h4>
              <p>从在线资源导入</p>
            </div>
            <div class="import-option" @click="importFromText">
              <h4>从文本导入</h4>
              <p>直接粘贴文本内容</p>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button @click="closeImportModal" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import type { RepositoryPrompt, RepositoryCategory } from '../stores/repository'

const repositoryStore = useRepositoryStore()

// 响应式数据
const viewMode = ref<'grid' | 'list'>('grid')
const selectedPrompt = ref<RepositoryPrompt | null>(null)
const showImportModal = ref(false)

// 计算属性
const categories = computed(() => repositoryStore.categories)
const filteredPrompts = computed(() => repositoryStore.filteredPrompts)
const loading = computed(() => repositoryStore.loading)
const error = computed(() => repositoryStore.error)
const currentPage = computed(() => repositoryStore.currentPage)
const totalPages = computed(() => repositoryStore.totalPages)
const filters = computed(() => repositoryStore.filters)

// 方法
const selectCategory = (categoryId: string) => {
  repositoryStore.updateFilters({ category: categoryId })
  repositoryStore.fetchPrompts(1, true)
}

const handleSearch = () => {
  repositoryStore.fetchPrompts(1, true)
}

const handleSort = () => {
  repositoryStore.fetchPrompts(1, true)
}

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(cat => cat.id === categoryId)
  return category ? category.name : '未知分类'
}

const getTags = (tags: string[]) => {
  return tags.slice(0, 3) // 只显示前3个标签
}

const viewPrompt = async (prompt: RepositoryPrompt) => {
  selectedPrompt.value = await repositoryStore.fetchPromptById(prompt.id)
}

const closePromptModal = () => {
  selectedPrompt.value = null
}

const copyPrompt = (prompt: RepositoryPrompt) => {
  navigator.clipboard.writeText(prompt.content)
    .then(() => {
      alert('提示词已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败:', err)
      alert('复制失败，请手动复制')
    })
}

const addToProject = (prompt: RepositoryPrompt) => {
  // 这里应该调用API将提示词添加到项目中
  alert('提示词已添加到项目中')
}

const closeImportModal = () => {
  showImportModal.value = false
}

const importFromFile = () => {
  // 实现文件导入逻辑
  alert('文件导入功能开发中')
}

const importFromUrl = () => {
  // 实现URL导入逻辑
  alert('URL导入功能开发中')
}

const importFromText = () => {
  // 实现文本导入逻辑
  alert('文本导入功能开发中')
}

const setPage = (page: number) => {
  repositoryStore.setPage(page)
  repositoryStore.fetchPrompts(page)
}

const refresh = () => {
  repositoryStore.refresh()
}

// 生命周期
onMounted(async () => {
  // 初始化数据
  await repositoryStore.fetchCategories()
  await repositoryStore.fetchPrompts(1, true)
})
</script>

<style scoped>
.prompt-repository {
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

.category-section {
  margin-bottom: 2rem;
}

.category-section h3 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.category-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.category-card.active {
  border-color: #1976D2;
  background: #f8f9ff;
  box-shadow: 0 8px 25px rgba(25, 118, 210, 0.15);
}

.category-icon {
  font-size: 2rem;
  color: #1976D2;
  margin-bottom: 1rem;
  text-align: center;
}

.category-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.category-info p {
  margin: 0 0 1rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.prompt-count {
  font-size: 0.8rem;
  color: #1976D2;
  font-weight: 500;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
}

.search-bar input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease;
  background: white;
}

.search-bar input:focus {
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.search-btn {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.25);
}

.search-btn:hover {
  background: linear-gradient(135deg, #1565C0, #0D47A1);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(25, 118, 210, 0.35);
}

.filter-options {
  display: flex;
  gap: 0.5rem;
}

.filter-options select {
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s ease;
}

.filter-options select:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.view-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  background: none;
  border: 2px solid #e9ecef;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.view-btn:first-child {
  border-radius: 6px 0 0 6px;
}

.view-btn:last-child {
  border-radius: 0 6px 6px 0;
}

.view-btn.active {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  border-color: #1976D2;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.25);
}

.view-btn:hover:not(.active) {
  background: rgba(25, 118, 210, 0.05);
  border-color: #1976D2;
}

.prompts-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: #6c757d;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.prompt-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.prompt-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.prompt-header h4 {
  margin: 0;
  color: #2c3e50;
  flex: 1;
  font-size: 1.1rem;
  font-weight: 600;
}

.prompt-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.category {
  font-size: 0.8rem;
  color: #1976D2;
  font-weight: 500;
}

.rating {
  font-size: 0.8rem;
  color: #ffc107;
}

.prompt-content p {
  margin: 0 0 1rem 0;
  color: #495057;
  line-height: 1.5;
}

.prompt-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: 1px solid #e9ecef;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  font-weight: 500;
}

.action-btn:hover {
  background: #e9ecef;
  border-color: #1976D2;
}

.action-btn.primary {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  border-color: #1976D2;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.25);
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #1565C0, #0D47A1);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.35);
}

.prompts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.prompt-list-item {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.prompt-list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.prompt-info {
  flex: 1;
}

.prompt-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.prompt-info p {
  margin: 0 0 1rem 0;
  color: #495057;
  line-height: 1.5;
}

.prompt-list-item .prompt-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.usage {
  font-size: 0.8rem;
  color: #6c757d;
}

.prompt-list-item .prompt-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-btn {
  background: linear-gradient(135deg, #6C757D, #5A6268);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.25);
}

.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5A6268, #495057);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.35);
}

.page-info {
  color: #6c757d;
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
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease;
  display: flex;
  flex-direction: column;
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

.prompt-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-row .label {
  font-weight: 500;
  color: #6c757d;
}

.prompt-content-display {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.prompt-content-display pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #495057;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
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

.import-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.import-option {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.import-option:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.import-option h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.import-option p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    max-width: none;
  }
  
  .view-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .prompts-grid {
    grid-template-columns: 1fr;
  }
  
  .prompt-list-item {
    flex-direction: column;
  }
  
  .prompt-list-item .prompt-actions {
    flex-direction: row;
    justify-content: flex-start;
    margin-top: 1rem;
  }
  
  .modal-content {
    width: 95%;
    max-width: none;
  }
}
</style>