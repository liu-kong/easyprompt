<template>
  <div id="app">
    <aside class="app-sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <button @click="toggleSidebar" class="sidebar-toggle">
          <span v-if="!isSidebarCollapsed">◀</span>
          <span v-else>▶</span>
        </button>
        <h1 class="app-title" v-show="!isSidebarCollapsed">
          <router-link to="/prompts" class="logo-link">
            EasyPrompt
          </router-link>
        </h1>
      </div>
      <nav class="main-nav">
        <router-link to="/prompts" class="nav-link" active-class="active">
          <span class="nav-icon" v-show="isSidebarCollapsed">提</span>
          <span v-show="!isSidebarCollapsed">提示词管理</span>
        </router-link>
        <router-link to="/projects" class="nav-link" active-class="active">
          <span class="nav-icon" v-show="isSidebarCollapsed">项</span>
          <span v-show="!isSidebarCollapsed">项目管理</span>
        </router-link>
        <router-link to="/export" class="nav-link" active-class="active">
          <span class="nav-icon" v-show="isSidebarCollapsed">导</span>
          <span v-show="!isSidebarCollapsed">数据导出</span>
        </router-link>
        <router-link to="/comparison" class="nav-link" active-class="active">
          <span class="nav-icon" v-show="isSidebarCollapsed">比</span>
          <span v-show="!isSidebarCollapsed">对比分析</span>
        </router-link>
        <router-link to="/code-generation" class="nav-link" active-class="active">
          <span class="nav-icon" v-show="isSidebarCollapsed">快速</span>
          <span v-show="!isSidebarCollapsed">快速开始</span>
        </router-link>
        <router-link to="/database-config" class="nav-link" active-class="active">
          <span class="nav-icon" v-show="isSidebarCollapsed">库</span>
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
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  width: 100%;
}

.app-sidebar {
  width: 180px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 50%, #4285F4 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: width 0.3s ease;
}

.app-sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 1.5rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.sidebar-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.logo-link {
  color: white;
  text-decoration: none;
  transition: opacity 0.2s;
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
  padding: 0.75rem 1rem;
  transition: all 0.2s;
  font-weight: 500;
  border-left: 3px solid transparent;
  display: flex;
  align-items: center;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-link.active {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border-left-color: white;
}

.nav-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.app-main {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  margin-left: 180px;
  width: calc(100% - 180px);
  min-height: 100vh;
  transition: margin-left 0.3s ease, width 0.3s ease;
}

.app-main.sidebar-collapsed {
  margin-left: 60px;
  width: calc(100% - 60px);
}


/* Responsive design */
@media (max-width: 768px) {
  .app-sidebar {
    width: 60px;
  }
  
  .app-main {
    margin-left: 60px;
    width: calc(100% - 60px);
    padding: 1rem;
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
    padding: 0.75rem;
    justify-content: center;
  }
  
  .nav-link span:not(.nav-icon) {
    display: none;
  }
}

@media (max-width: 480px) {
  .app-sidebar {
    width: 60px;
  }
  
  .app-main {
    margin-left: 60px;
    width: calc(100% - 60px);
    padding: 1rem;
  }
  
  .sidebar-header {
    padding: 0.75rem 0.25rem;
  }
  
  .main-nav {
    padding: 0.25rem 0;
  }
  
  .nav-link {
    padding: 0.5rem;
  }
}
</style>
