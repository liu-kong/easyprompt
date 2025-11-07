<template>
  <div class="documentation">
    <div class="doc-content">
      <div v-if="loading" class="doc-loading">
        加载中...
      </div>
      
      <div v-else-if="error" class="doc-error">
        {{ error }}
        <button @click="loadDocument" class="btn btn-secondary">重试</button>
      </div>
      
      <template v-else>
        <div class="doc-header">
          <h1>{{ currentPageData?.title }}</h1>
          <div class="doc-meta">
            <span class="last-updated" v-if="currentPageData?.lastUpdated">
              最后更新: {{ formatDate(currentPageData.lastUpdated) }}
            </span>
          </div>
        </div>
        
        <div class="doc-body" v-html="currentPageData?.content"></div>
        
        <div class="doc-navigation">
          <router-link
            v-if="prevPage"
            :to="`/docs/${prevPage.path}`"
            class="nav-prev"
          >
            <span class="nav-direction">上一页</span>
            <div class="nav-info">
              <span class="nav-label">上一页</span>
              <span class="nav-title">{{ prevPage.title }}</span>
            </div>
          </router-link>
          
          <router-link
            v-if="nextPage"
            :to="`/docs/${nextPage.path}`"
            class="nav-next"
          >
            <div class="nav-info">
              <span class="nav-label">下一页</span>
              <span class="nav-title">{{ nextPage.title }}</span>
            </div>
            <span class="nav-direction">下一页</span>
          </router-link>
        </div>
      </template>
    </div>
    
    <div class="doc-sidebar">
      <div class="doc-search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文档..."
          class="search-input"
        />
      </div>
      <div class="doc-nav">
        <div
          v-for="section in filteredSections"
          :key="section.title"
          class="nav-section"
        >
          <h3 class="nav-section-title">{{ section.title }}</h3>
          <ul class="nav-section-list">
            <li
              v-for="page in section.pages"
              :key="page.path"
              class="nav-item"
            >
              <router-link
                :to="`/docs/${page.path}`"
                class="nav-link"
                :class="{ active: currentPage === page.path }"
              >
                {{ page.title }}
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// 获取 API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const DOCS_BASE_URL = API_BASE_URL.replace('/api', '')

// 配置 marked 的 renderer
const renderer = new marked.Renderer()

// 配置 marked 选项
marked.setOptions({
  renderer: renderer,
  highlight: function(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error('Highlight.js error:', err)
      }
    }
    return hljs.highlightAuto(code).value
  },
  langPrefix: 'hljs language-',
  breaks: true,
  gfm: true
} as any)

interface DocPage {
  title: string
  path: string
  content: string
  lastUpdated?: string
}

interface DocSection {
  title: string
  pages: DocPage[]
}

const route = useRoute()
const searchQuery = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const documentation = ref<DocSection[]>([])
const currentPageData = ref<DocPage | null>(null)

// 从服务器获取文档结构
const fetchDocStructure = async (): Promise<DocSection[]> => {
  try {
    const response = await fetch(`${DOCS_BASE_URL}/docs`)
    if (!response.ok) {
      throw new Error(`无法获取文档列表: ${response.statusText}`)
    }
    
    const files = await response.json()
    
    // 将文件列表转换为文档结构
    const docMap = new Map<string, DocPage[]>()
    
    for (const file of files) {
      // 从文件名中提取路径和标题
      const path = file.replace('.md', '')
      const title = extractTitleFromFile(file)
      
      // 根据文件路径确定分类
      let category = '其他'
      if (['introduction', 'getting-started'].includes(path)) {
        category = '快速开始'
      } else if (['projects', 'prompts'].includes(path)) {
        category = '核心功能'
      } else if (['database', 'import-export', 'data-persistence'].includes(path)) {
        category = '高级功能'
      } else if (['api-overview'].includes(path)) {
        category = 'API 参考'
      }
      
      if (!docMap.has(category)) {
        docMap.set(category, [])
      }
      
      docMap.get(category)?.push({
        title,
        path,
        content: ''
      })
    }
    
    // 转换为 DocSection 数组
    const sections: DocSection[] = []
    for (const [title, pages] of docMap.entries()) {
      sections.push({ title, pages })
    }
    
    return sections
  } catch (err) {
    console.error('获取文档结构失败:', err)
    // 返回默认结构
    return [
      {
        title: '快速开始',
        pages: [
          { title: '介绍', path: 'introduction', content: '' },
          { title: '安装和设置', path: 'getting-started', content: '' }
        ]
      }
    ]
  }
}

// 从文件名提取标题
const extractTitleFromFile = (filename: string): string => {
  const name = filename.replace('.md', '')
  const titleMap: Record<string, string> = {
    'introduction': '介绍',
    'getting-started': '安装和设置',
    'projects': '项目管理',
    'prompts': '提示词管理',
    'database': '数据库配置',
    'import-export': '数据导入导出',
    'data-persistence': '数据持久化',
    'api-overview': 'API 概览'
  }
  
  return titleMap[name] || name
}

// 获取当前页面路径
const currentPage = computed(() => {
  const path = route.path
  if (path.startsWith('/docs/')) {
    return path.replace('/docs/', '')
  }
  return 'introduction'
})

// 过滤后的文档结构（用于搜索）
const filteredSections = computed(() => {
  if (!searchQuery.value) return documentation.value
  
  const query = searchQuery.value.toLowerCase()
  const filtered: DocSection[] = []
  
  for (const section of documentation.value) {
    const filteredPages = section.pages.filter((page: DocPage) =>
      page.title.toLowerCase().includes(query)
    )
    
    if (filteredPages.length > 0) {
      filtered.push({
        title: section.title,
        pages: filteredPages
      })
    }
  }
  
  return filtered
})

// 获取上一页和下一页
const allPages = computed(() => {
  const pages: DocPage[] = []
  for (const section of documentation.value) {
    pages.push(...section.pages)
  }
  return pages
})

const currentIndex = computed(() => {
  return allPages.value.findIndex((page: DocPage) => page.path === currentPage.value)
})

const prevPage = computed(() => {
  if (currentIndex.value > 0) {
    return allPages.value[currentIndex.value - 1]
  }
  return null
})

const nextPage = computed(() => {
  if (currentIndex.value < allPages.value.length - 1) {
    return allPages.value[currentIndex.value + 1]
  }
  return null
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 加载当前文档内容
const loadDocument = async () => {
  try {
    loading.value = true
    error.value = null
    
    // 直接从docs目录加载Markdown文件
    const response = await fetch(`${DOCS_BASE_URL}/docs/${currentPage.value}.md`)
    if (!response.ok) {
      throw new Error(`无法加载文档: ${response.statusText}`)
    }
    
    const markdownContent = await response.text()
    
    // 使用 marked 解析 Markdown
    const htmlContent = await marked(markdownContent)
    
    // 为代码块添加语言标签
    const processedHtml = htmlContent.replace(
      /<pre><code class="hljs language-([^"]+)">([\s\S]*?)<\/code><\/pre>/g,
      (match, lang, code) => {
        return `<pre data-language="${lang.toUpperCase()}"><code class="hljs language-${lang}">${code}</code></pre>`
      }
    )
    
    currentPageData.value = {
      title: extractTitle(markdownContent),
      path: currentPage.value,
      content: processedHtml,
      lastUpdated: new Date().toISOString()
    }
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

// 从 Markdown 内容中提取标题
const extractTitle = (content: string): string => {
  const titleMatch = content.match(/^#\s+(.+)$/m)
  return titleMatch && titleMatch[1] ? titleMatch[1].trim() : '无标题'
}

// 监听路由变化
watch(() => route.path, () => {
  loadDocument()
  window.scrollTo(0, 0)
})

// 组件挂载时加载文档
onMounted(async () => {
  documentation.value = await fetchDocStructure()
  loadDocument()
})
</script>

<style scoped>
.documentation {
  display: flex;
  min-height: calc(100vh - 80px);
  margin-top: 20px;
  position: relative;
}

.doc-sidebar {
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-left: 2rem;
  height: fit-content;
  position: sticky;
  top: 20px;
  align-self: flex-start;
}

.doc-search {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-section-list {
  list-style: none;
  padding: 0;
}

.nav-item {
  margin-bottom: 0.25rem;
}

.nav-link {
  display: block;
  padding: 0.5rem 0.75rem;
  color: #495057;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: #f8f9fa;
  color: #1976D2;
}

.nav-link.active {
  background-color: #E3F2FD;
  color: #1976D2;
  font-weight: 500;
}

.doc-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  max-width: 1200px;
}

.doc-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.doc-header h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 2.2rem;
}

.doc-meta {
  font-size: 0.9rem;
  color: #6c757d;
}

.doc-body {
  line-height: 1.7;
  color: #333;
  text-align: left;
  padding-left: 1rem;
}

.doc-body h2 {
  color: #2c3e50;
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #eee;
}

.doc-body h3 {
  color: #34495e;
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
}

.doc-body p {
  margin-bottom: 1rem;
}

.doc-body ul, .doc-body ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.doc-body li {
  margin-bottom: 0.5rem;
}

.doc-body pre {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.doc-body code {
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.doc-body pre code {
  background-color: transparent;
  padding: 0;
}

/* 表格样式 */
.doc-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.doc-body :deep(th),
.doc-body :deep(td) {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: left;
}

.doc-body :deep(th) {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.doc-body :deep(tr:nth-child(even)) {
  background-color: #f8f9fa;
}

.doc-body :deep(tr:hover) {
  background-color: #e9ecef;
}

/* 引用块样式 */
.doc-body :deep(blockquote) {
  margin: 1.5rem 0;
  padding: 0.5rem 1.5rem;
  border-left: 5px solid #1976D2;
  background-color: #f8f9fa;
  color: #495057;
}

.doc-body :deep(blockquote p) {
  margin-bottom: 0;
}

/* 链接样式 */
.doc-body :deep(a) {
  color: #1976D2;
  text-decoration: none;
  transition: color 0.2s;
}

.doc-body :deep(a:hover) {
  color: #1565C0;
  text-decoration: underline;
}

/* 代码块语言标签 */
.doc-body :deep(pre) {
  position: relative;
}

.doc-body :deep(pre::after) {
  content: attr(data-language);
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.25rem 0.5rem;
  background-color: #e9ecef;
  color: #495057;
  font-size: 0.75rem;
  border-radius: 0 0 0 4px;
  font-weight: 500;
}

/* 任务列表样式 */
.doc-body :deep(input[type="checkbox"]) {
  margin-right: 0.5rem;
}

.doc-body :deep(li.task-list-item) {
  list-style: none;
}

/* 分隔线样式 */
.doc-body :deep(hr) {
  border: none;
  height: 2px;
  background-color: #e9ecef;
  margin: 2rem 0;
}

/* 图片样式 */
.doc-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
}

/* 行内代码样式改进 */
.doc-body :deep(:not(pre) > code) {
  background-color: #f1f3f4;
  color: #d73a49;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.85em;
}

/* 代码块样式改进 */
.doc-body :deep(pre) {
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.85em;
  line-height: 1.45;
}

.doc-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.nav-prev, .nav-next {
  display: flex;
  align-items: center;
  color: #495057;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
  max-width: 45%;
}

.nav-prev:hover, .nav-next:hover {
  background-color: #f8f9fa;
  color: #1976D2;
  border-color: #1976D2;
}

.nav-prev {
  justify-content: flex-start;
}

.nav-next {
  justify-content: flex-end;
}

.nav-direction {
  font-size: 1.2rem;
  margin: 0 0.5rem;
}

.nav-info {
  display: flex;
  flex-direction: column;
}

.nav-label {
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.nav-title {
  font-weight: 500;
}

@media (max-width: 1024px) {
  .documentation {
    flex-direction: column;
  }
  
  .doc-sidebar {
    width: 100%;
    margin-left: 0;
    margin-bottom: 2rem;
    position: static;
    order: 2;
  }
  
  .doc-content {
    max-width: 100%;
    order: 1;
  }
}
</style>