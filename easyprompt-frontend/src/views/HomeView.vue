<template>
  <div class="home">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">EasyPrompt</h1>
        <p class="page-subtitle">简单易用的提示词管理平台</p>
      </div>
    </div>
    
    <div class="page-content">
      <div class="actions">
        <div class="action-card" @click="goToProjects">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>项目管理</h3>
          <p>创建和管理您的提示词项目</p>
        </div>
        
        <div class="action-card" @click="goToPrompts">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3>提示词管理</h3>
          <p>编辑和管理提示词内容</p>
        </div>
        
        <div class="action-card" @click="goToExport">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <h3>数据导出</h3>
          <p>导出SQL命令和JSON数据</p>
        </div>
        
        <div class="action-card" @click="goToComparison">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11H3v10h6V11z"></path>
              <path d="M21 3h-6v18h6V3z"></path>
              <path d="M15 7H9v14h6V7z"></path>
            </svg>
          </div>
          <h3>对比分析</h3>
          <p>对比不同版本的提示词差异</p>
        </div>
        
        <div class="action-card" @click="goToCodeGeneration">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </div>
          <h3>代码生成</h3>
          <p>生成Python、Java、Go代码</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToProjects = () => {
  router.push('/projects')
}

const goToPrompts = () => {
  router.push('/prompts')
}

const goToExport = () => {
  router.push('/export')
}

const goToComparison = () => {
  router.push('/comparison')
}

const goToCodeGeneration = () => {
  router.push('/code-generation')
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
}

.page-header {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

.page-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
}

.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #6366f1;
}

.card-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: white;
}

.action-card h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
}

.action-card p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
  font-size: 0.95rem;
}
</style>
