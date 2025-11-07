<template>
  <div class="about">
    <div class="about-content">
      <h1>关于 EasyPrompt</h1>
      <div class="about-section">
        <h2>项目简介</h2>
        <p>EasyPrompt 是一个简单易用的提示词管理平台，旨在帮助开发者和管理者高效地组织、管理和版本控制提示词内容。</p>
      </div>
      
      <div class="about-section">
        <h2>主要功能</h2>
        <ul>
          <li>项目管理 - 创建和管理提示词项目</li>
          <li>提示词管理 - 编辑和管理提示词内容</li>
          <li>版本控制 - 跟踪提示词的版本变化</li>
          <li>数据导出 - 导出SQL命令和JSON数据</li>
          <li>对比分析 - 对比不同版本的提示词差异</li>
          <li>代码生成 - 生成Python、Java、Go代码</li>
        </ul>
      </div>
      
      <div class="about-section">
        <h2>技术栈</h2>
        <div class="tech-stack">
          <div class="tech-category">
            <h3>前端</h3>
            <p>Vue 3 + TypeScript + Pinia</p>
          </div>
          <div class="tech-category">
            <h3>后端</h3>
            <p>Node.js + Express + TypeScript</p>
          </div>
          <div class="tech-category">
            <h3>数据库</h3>
            <p>SQLite / MySQL / PostgreSQL</p>
          </div>
          <div class="tech-category">
            <h3>部署</h3>
            <p>Docker + Docker Compose</p>
          </div>
        </div>
      </div>
      
      <div class="about-section">
        <h2>版本信息</h2>
        <p>当前版本: v1.0.0</p>
        <p>发布日期: 2024年</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.about-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.about-content h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.about-section {
  margin-bottom: 2rem;
}

.about-section h2 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.about-section p {
  line-height: 1.6;
  color: #555;
}

.about-section ul {
  list-style-type: disc;
  padding-left: 2rem;
}

.about-section li {
  margin-bottom: 0.5rem;
  color: #555;
}

.tech-stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.tech-category {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.tech-category h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.tech-category p {
  margin: 0;
  color: #555;
}

@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
