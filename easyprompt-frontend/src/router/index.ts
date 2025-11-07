import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/prompts'
    },
    {
      path: '/prompts',
      name: 'prompts',
      component: () => import('../views/PromptsView.vue'),
    },
    {
      path: '/repository',
      name: 'repository',
      component: () => import('../views/PromptRepositoryView.vue'),
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/ProjectsView.vue'),
    },
    {
      path: '/export',
      name: 'export',
      component: () => import('../views/ExportView.vue'),
    },
    {
      path: '/comparison',
      name: 'comparison',
      component: () => import('../views/ComparisonView.vue'),
    },
    {
      path: '/code-generation',
      name: 'code-generation',
      component: () => import('../views/CodeGenerationView.vue'),
    },
    {
      path: '/database-config',
      name: 'database-config',
      component: () => import('../views/DatabaseConfigView.vue'),
    },
    {
      path: '/docs/:path?',
      name: 'documentation',
      component: () => import('../components/Documentation.vue'),
    },
    {
      path: '/prompt-testing',
      name: 'prompt-testing',
      component: () => import('../views/PromptTestingView.vue'),
    },
  ],
})

export default router
