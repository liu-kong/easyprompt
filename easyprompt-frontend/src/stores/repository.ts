import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from './api'

export interface RepositoryPrompt {
  id: string
  title: string
  content: string
  description?: string
  category: string
  tags: string[]
  author?: string
  version?: string
  created_at: string
  updated_at: string
  usage_count: number
  rating: number
  is_public: boolean
}

export interface RepositoryCategory {
  id: string
  name: string
  description?: string
  icon?: string
  prompt_count: number
}

export interface RepositoryFilters {
  category?: string
  tags?: string
  search?: string
  sort_by?: 'created_at' | 'updated_at' | 'usage_count' | 'rating'
  sort_order?: 'asc' | 'desc'
}

export const useRepositoryStore = defineStore('repository', () => {
  // State
  const categories = ref<RepositoryCategory[]>([])
  const prompts = ref<RepositoryPrompt[]>([])
  const totalPrompts = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const filters = ref<RepositoryFilters>({
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const popularTags = ref<{ tag: string, count: number }[]>([])

  // Getters
  const filteredPrompts = computed(() => prompts.value)

  const totalPages = computed(() => Math.ceil(totalPrompts.value / pageSize.value))

  const hasMore = computed(() => currentPage.value < totalPages.value)

  // Actions
  const fetchCategories = async () => {
    try {
      loading.value = true
      error.value = null
      const response = await api.get('/repository/categories')
      categories.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch categories'
      console.error('Error fetching categories:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchPrompts = async (page: number = 1, reset: boolean = false) => {
    try {
      loading.value = true
      error.value = null

      const params = {
        page,
        limit: pageSize.value,
        ...filters.value
      }

      const response = await api.get('/repository/prompts', { params })
      
      if (reset) {
        prompts.value = response.data.prompts
      } else {
        prompts.value = response.data.prompts
      }
      
      totalPrompts.value = response.data.total
      currentPage.value = page
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch prompts'
      console.error('Error fetching prompts:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchPromptById = async (id: string): Promise<RepositoryPrompt | null> => {
    try {
      loading.value = true
      error.value = null
      const response = await api.get(`/repository/prompts/${id}`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch prompt'
      console.error('Error fetching prompt by ID:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const addPrompt = async (promptData: Omit<RepositoryPrompt, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<RepositoryPrompt | null> => {
    try {
      loading.value = true
      error.value = null
      const response = await api.post('/repository/prompts', promptData)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to add prompt'
      console.error('Error adding prompt:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const importPrompts = async (promptsData: Omit<RepositoryPrompt, 'id' | 'created_at' | 'updated_at' | 'usage_count'>[]): Promise<{ importedCount: number, message: string } | null> => {
    try {
      loading.value = true
      error.value = null
      const response = await api.post('/repository/import', { prompts: promptsData })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to import prompts'
      console.error('Error importing prompts:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchPopularTags = async (limit: number = 20) => {
    try {
      loading.value = true
      error.value = null
      const response = await api.get('/repository/tags', { params: { limit } })
      popularTags.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch popular tags'
      console.error('Error fetching popular tags:', err)
    } finally {
      loading.value = false
    }
  }

  const initializeRepository = async () => {
    try {
      loading.value = true
      error.value = null
      await api.post('/repository/initialize')
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to initialize repository'
      console.error('Error initializing repository:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const updateFilters = (newFilters: Partial<RepositoryFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      sort_by: 'created_at',
      sort_order: 'desc'
    }
  }

  const setPage = (page: number) => {
    currentPage.value = page
  }

  const setPageSize = (size: number) => {
    pageSize.value = size
  }

  const loadMore = async () => {
    if (hasMore.value && !loading.value) {
      await fetchPrompts(currentPage.value + 1)
    }
  }

  const refresh = async () => {
    await fetchPrompts(1, true)
  }

  return {
    // State
    categories,
    prompts,
    totalPrompts,
    currentPage,
    pageSize,
    filters,
    loading,
    error,
    popularTags,
    
    // Getters
    filteredPrompts,
    totalPages,
    hasMore,
    
    // Actions
    fetchCategories,
    fetchPrompts,
    fetchPromptById,
    addPrompt,
    importPrompts,
    fetchPopularTags,
    initializeRepository,
    updateFilters,
    resetFilters,
    setPage,
    setPageSize,
    loadMore,
    refresh
  }
})