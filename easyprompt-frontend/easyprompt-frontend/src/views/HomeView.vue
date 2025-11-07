<template>
  <div class="home">
    <div class="header">
      <h1>EasyPrompt</h1>
      <p class="subtitle">简单易用的提示词管理平台</p>
    </div>
    
    <div class="actions">
      <div class="action-card" @click="goToProjects">
        <h3>项目管理</h3>
        <p>创建和管理您的提示词项目</p>
      </div>
      
      <div class="action-card" @click="goToPrompts">
        <h3>提示词管理</h3>
        <p>编辑和管理提示词内容</p>
      </div>
      
      <div class="action-card" @click="goToExport">
        <h3>数据导出</h3>
        <p>导出SQL命令和JSON数据</p>
      </div>
      
      <div class="action-card" @click="goToComparison">
        <h3>对比分析</h3>
        <p>对比不同版本的提示词差异</p>
      </div>
      
      <div class="action-card" @click="goToCodeGeneration">
        <h3>代码生成</h3>
        <p>生成Python、Java、Go代码</p>
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 3rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #7f8c8d;
}

.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.action-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.action-card h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.action-card p {
  margin: 0;
  color: #7f8c8d;
  line-height: 1.5;
}
</style>
