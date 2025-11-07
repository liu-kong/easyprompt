<template>
  <div id="app">
    <aside class="app-sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <button @click="toggleSidebar" class="sidebar-toggle">
          <svg v-if="!isSidebarCollapsed" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <h1 class="app-title" v-show="!isSidebarCollapsed">
          <router-link to="/prompts" class="logo-link">
            EasyPrompt
          </router-link>
        </h1>
      </div>
      <nav class="main-nav">
        <router-link to="/prompts" class="nav-link" active-class="active">
          <div class="nav-icon" v-show="isSidebarCollapsed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <span v-show="!isSidebarCollapsed">提示词管理</span>
        </router-link>
        <router-link to="/repository" class="nav-link" active-class="active">
          <div class="nav-icon" v-show="isSidebarCollapsed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
            </svg>
          </div>
          <span v-show="!isSidebarCollapsed">提示词仓库</span>
        </router-link>
        <router-link to="/prompt-testing" class="nav-link" active-class="active">
          <div class="nav-icon" v-show="isSidebarCollapsed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <span v-show="!isSidebarCollapsed">提示词测试</span>
        </router-link>
        <router-link to="/projects" class="nav-link" active-class="active">
          <div class="nav-icon" v-show="isSidebarCollapsed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <span v-show="!isSidebarCollapsed">项目管理</span>
        </router-link>
        <router-link to="/export" class="nav-link" active-class="active">
          <div class="nav-icon" v-show="isSidebarCollapsed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <span v-show="!isSidebarCollapsed">数据导出</span>
        </router-link>
        <router-link to="/comparison" class="nav-link" active-class="active">
          <div class="nav-icon" v-show="isSidebarCollapsed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11H3v10h6V11z"></path>
              <path d="M21 3h-6v18h6V3z"></path>
              <path d="M15 7H9v14h6V7z"></path>
            </svg>
          </div>
          <span v-show="!isSidebarCollapsed">对比分析</span>
        </router-link>
        <router-link to="/code-generation" class="nav-link" active-class="active">
          <div class="nav-icon" v-show="isSidebarCollapsed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </div>
          <span v-show="!isSidebarCollapsed">快速开始</span>
        </router-link>
        <router-link to="/database-config" class="nav-link" active-class="active">
          <div class="nav-icon" v-show="isSidebarCollapsed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
          </div>
          <span v-show="!isSidebarCollapsed">数据库配置</span>
        </router-link>
      </nav>
    </aside>

    <main class="app-main" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  width: 100%;
}

.app-sidebar {
  width: 240px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.05);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: width 0.3s ease;
}

.app-sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.logo-link {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.logo-link:hover {
  opacity: 0.8;
}

.main-nav {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  flex: 1;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 0.875rem 1rem;
  transition: all 0.3s ease;
  font-weight: 500;
  border-left: 4px solid transparent;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transition: width 0.3s ease;
}

.nav-link:hover::before {
  width: 100%;
}

.nav-link:hover {
  color: white;
}

.nav-link.active {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  border-left-color: white;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.app-main {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  margin-left: 240px;
  width: calc(100% - 240px);
  min-height: 100vh;
  transition: margin-left 0.3s ease, width 0.3s ease;
  background-color: #f8f9fa;
}

.app-main.sidebar-collapsed {
  margin-left: 80px;
  width: calc(100% - 80px);
}

/* Responsive design */
@media (max-width: 768px) {
  .app-sidebar {
    width: 80px;
  }
  
  .app-main {
    margin-left: 80px;
    width: calc(100% - 80px);
  }
  
  .sidebar-header {
    padding: 1rem 0.5rem;
    justify-content: center;
  }
  
  .sidebar-toggle {
    display: none;
  }
  
  .main-nav {
    padding: 0.5rem 0;
  }
  
  .nav-link {
    padding: 0.875rem;
    justify-content: center;
  }
  
  .nav-link span:not(.nav-icon) {
    display: none;
  }
  
  .nav-icon {
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  .app-sidebar {
    width: 70px;
  }
  
  .app-main {
    margin-left: 70px;
    width: calc(100% - 70px);
  }
  
  .sidebar-header {
    padding: 0.75rem 0.25rem;
  }
  
  .main-nav {
    padding: 0.25rem 0;
  }
  
  .nav-link {
    padding: 0.75rem;
  }
}
</style>
