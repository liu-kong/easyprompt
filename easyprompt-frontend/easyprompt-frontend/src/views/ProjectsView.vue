<template>
  <div class="projects">
    <div class="header">
      <h2>项目管理</h2>
      <button class="btn btn-primary" @click="showCreateModal = true">
        新建项目
      </button>
    </div>

    <div v-if="projectsStore.loading" class="loading">
      加载中...
    </div>

    <div v-else-if="projectsStore.error" class="error">
      {{ projectsStore.error }}
      <button @click="projectsStore.clearError" class="btn btn-secondary">重试</button>
    </div>

    <div v-else class="project-list">
      <div 
        v-for="project in projectsStore.projects" 
        :key="project.id"
        class="project-card"
        @click="selectProject(project)"
      >
        <h3>{{ project.name }}</h3>
        <p v-if="project.description">{{ project.description }}</p>
        <div class="project-meta">
          <span>创建时间: {{ formatDate(project.created_at) }}</span>
          <span>更新时间: {{ formatDate(project.updated_at) }}</span>
        </div>
        <div class="project-actions">
          <button @click.stop="viewTables(project)" class="btn btn-info">
            查看提示词表
          </button>
          <button @click.stop="createTable(project)" class="btn btn-success">
            新建提示词表
          </button>
          <button @click.stop="editProject(project)" class="btn btn-secondary">
            编辑
          </button>
          <button @click.stop="deleteProject(project.id)" class="btn btn-danger">
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑项目模态框 -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>{{ editingProject ? '编辑项目' : '新建项目' }}</h3>
        <form @submit.prevent="saveProject">
          <div class="form-group">
            <label for="name">项目名称</label>
            <input 
              id="name" 
              v-model="projectForm.name" 
              type="text" 
              required 
              placeholder="输入项目名称"
            />
          </div>
          <div class="form-group">
            <label for="description">项目描述</label>
            <textarea 
              id="description" 
              v-model="projectForm.description" 
              placeholder="输入项目描述"
              rows="4"
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
        <h3>新建提示词表</h3>
        <form @submit.prevent="saveTable">
          <div class="form-group">
            <label for="tableName">表名称</label>
            <input
              id="tableName"
              v-model="tableForm.name"
              type="text"
              required
              placeholder="输入提示词表名称"
            />
          </div>
          <div class="form-group">
            <label for="tableDisplayName">显示名称</label>
            <input
              id="tableDisplayName"
              v-model="tableForm.table_name"
              type="text"
              required
              placeholder="输入提示词表显示名称"
            />
          </div>
          <div class="form-group">
            <label for="tableDescription">表描述</label>
            <textarea
              id="tableDescription"
              v-model="tableForm.description"
              placeholder="输入提示词表描述"
              rows="4"
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

const deleteProject = async (id: number) => {
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
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h2 {
  margin: 0;
  color: #2c3e50;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
}

.project-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.project-card h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.project-card p {
  margin: 0 0 1rem 0;
  color: #7f8c8d;
  line-height: 1.5;
}

.project-meta {
  font-size: 0.9rem;
  color: #95a5a6;
  margin-bottom: 1rem;
}

.project-meta span {
  display: block;
  margin-bottom: 0.25rem;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal h3 {
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
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
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #1976D2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565C0;
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
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

.btn-info {
  background: #17A2B8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.btn-success {
  background: #28A745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}
</style>