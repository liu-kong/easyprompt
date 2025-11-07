<template>
  <div class="projects">
    <div class="header">
      <div class="header-content">
        <div class="header-text">
          <h2>项目管理</h2>
          <p class="header-subtitle">管理和组织您的提示词项目</p>
        </div>
        <button class="btn btn-primary btn-large" @click="showCreateModal = true">
          <span class="btn-icon">新建</span>
          新建项目
        </button>
      </div>
    </div>

    <div v-if="projectsStore.loading" class="loading">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="projectsStore.error" class="error">
      <div class="error-card">
        <div class="error-icon">警告</div>
        <div class="error-content">
          <h3>加载失败</h3>
          <p>{{ projectsStore.error }}</p>
          <button @click="projectsStore.clearError" class="btn btn-secondary">重试</button>
        </div>
      </div>
    </div>

    <div v-else>
      <div v-if="projectsStore.projects.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <h3>暂无项目</h3>
        <p>您还没有创建任何项目，点击上方按钮创建第一个项目</p>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <span class="btn-icon">+</span>
          创建第一个项目
        </button>
      </div>
      
      <div v-else class="project-list">
        <div
          v-for="project in projectsStore.projects"
          :key="project.id"
          class="project-card"
          @click="editProject(project)"
        >
          <div class="project-card-inner">
            <div class="project-header">
              <div class="project-title">
                <h3>{{ project.name }}</h3>
                <div class="project-badge">项目</div>
              </div>
              <button @click.stop="deleteProject(String(project.id))" class="btn-icon-only btn-danger" title="删除">
                删除
              </button>
            </div>
            <p v-if="project.description" class="project-description">{{ project.description }}</p>
            <div class="project-meta">
              <div class="meta-item">
                <div class="meta-text">
                  <span class="meta-label">创建时间</span>
                  <span class="meta-value">{{ formatDate(project.created_at) }}</span>
                </div>
              </div>
              <div class="meta-item">
                <div class="meta-text">
                  <span class="meta-label">更新时间</span>
                  <span class="meta-value">{{ formatDate(project.updated_at) }}</span>
                </div>
              </div>
            </div>
            <div class="project-footer">
              <button @click.stop="viewTables(project)" class="btn btn-outline">
                <span class="btn-icon">查看表</span>
              </button>
              <button @click.stop="createTable(project)" class="btn btn-primary">
                <span class="btn-icon">新建表</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑项目模态框 -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingProject ? '编辑项目' : '新建项目' }}</h3>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveProject">
          <div class="form-group">
            <label for="name">项目名称 <span class="required">*</span></label>
            <input
              id="name"
              v-model="projectForm.name"
              type="text"
              required
              placeholder="输入项目名称"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="description">项目描述</label>
            <textarea
              id="description"
              v-model="projectForm.description"
              placeholder="输入项目描述（可选）"
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!projectForm.name">
              {{ editingProject ? '更新' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 创建提示词表模态框 -->
    <div v-if="showCreateTableModal" class="modal-overlay" @click="closeTableModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>新建提示词表</h3>
          <button @click="closeTableModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveTable">
          <div class="form-group">
            <label for="tableName">表名称 <span class="required">*</span></label>
            <input
              id="tableName"
              v-model="tableForm.name"
              type="text"
              required
              placeholder="输入提示词表名称"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="tableDisplayName">显示名称 <span class="required">*</span></label>
            <input
              id="tableDisplayName"
              v-model="tableForm.table_name"
              type="text"
              required
              placeholder="输入提示词表显示名称"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="tableDescription">表描述</label>
            <textarea
              id="tableDescription"
              v-model="tableForm.description"
              placeholder="输入提示词表描述（可选）"
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeTableModal" class="btn btn-secondary">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!tableForm.name || !tableForm.table_name">
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import api from '@/stores/api'
import type { Project } from '@/types'

const projectsStore = useProjectsStore()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showCreateTableModal = ref(false)
const editingProject = ref<Project | null>(null)
const currentProject = ref<Project | null>(null)

const projectForm = ref({
  name: '',
  description: ''
})

const tableForm = ref({
  name: '',
  table_name: '',
  description: ''
})

onMounted(() => {
  projectsStore.fetchProjects()
})

const selectProject = (project: Project) => {
  projectsStore.setCurrentProject(project)
  // 这里可以导航到项目详情页面
}

const viewTables = (project: Project) => {
  // 导航到提示词管理页面，并选择该项目
  currentProject.value = project
  // 这里可以添加路由导航逻辑
}

const createTable = (project: Project) => {
  currentProject.value = project
  showCreateTableModal.value = true
}

const editProject = (project: Project) => {
  editingProject.value = project
  projectForm.value = {
    name: project.name,
    description: project.description || ''
  }
  showEditModal.value = true
}

const deleteProject = async (id: string) => {
  if (confirm('确定要删除这个项目吗？')) {
    try {
      await projectsStore.deleteProject(id)
    } catch (error) {
      alert('删除失败: ' + (error as Error).message)
    }
  }
}

const saveProject = async () => {
  try {
    if (editingProject.value) {
      await projectsStore.updateProject(editingProject.value.id, projectForm.value)
    } else {
      await projectsStore.createProject(projectForm.value)
    }
    closeModal()
  } catch (error) {
    alert('保存失败: ' + (error as Error).message)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingProject.value = null
  projectForm.value = {
    name: '',
    description: ''
  }
}

const closeTableModal = () => {
  showCreateTableModal.value = false
  currentProject.value = null
  tableForm.value = {
    name: '',
    table_name: '',
    description: ''
  }
}

const saveTable = async () => {
  if (!currentProject.value) return
  
  try {
    await api.post('/prompt-tables', {
      ...tableForm.value,
      project_id: currentProject.value.id
    })
    closeTableModal()
    alert('提示词表创建成功')
  } catch (error) {
    alert('创建失败: ' + (error as Error).message)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.projects {
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

.loading, .error {
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

.project-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.project-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  position: relative;
}

.project-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #e0e0e0;
}

.project-card-inner {
  padding: 1.25rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.project-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.project-title h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.2;
}

.project-badge {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.project-description {
  margin: 0 0 0.75rem 0;
  color: #6c757d;
  line-height: 1.5;
  font-size: 0.85rem;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-icon-container {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.meta-icon {
  font-size: 0.9rem;
  color: #6c757d;
}

.meta-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.meta-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 0.8rem;
  color: #2c3e50;
  font-weight: 600;
}

.project-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
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
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
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
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
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
}

.modal form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.required {
  color: #e74c3c;
  margin-left: 0.25rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1976D2;
  background: white;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.btn-icon {
  font-size: 1rem;
  font-weight: bold;
}

.btn-primary {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  color: white;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1565C0, #0D47A1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.35);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-outline {
  background: transparent;
  color: #1976D2;
  border: 2px solid #1976D2;
}

.btn-outline:hover {
  background: rgba(25, 118, 210, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
}

.btn-secondary {
  background: #6C757D;
  color: white;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.25);
}

.btn-secondary:hover {
  background: #5A6268;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.35);
}

.btn-danger {
  background: #DC3545;
  color: white;
}

.btn-danger:hover {
  background: #BB2D3B;
  transform: translateY(-1px);
}

.btn-info {
  background: #17A2B8;
  color: white;
}

.btn-info:hover {
  background: #138496;
  transform: translateY(-1px);
}

.btn-success {
  background: #28A745;
  color: white;
}

.btn-success:hover {
  background: #218838;
  transform: translateY(-1px);
}

.btn-icon-only {
  padding: 0.375rem;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-icon-only:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}

.btn-icon-only.btn-danger:hover {
  background: rgba(220, 53, 69, 0.1);
  color: #DC3545;
}

@media (max-width: 768px) {
  .projects {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .project-list {
    grid-template-columns: 1fr;
  }
  
  .modal {
    width: 95%;
  }
}
</style>