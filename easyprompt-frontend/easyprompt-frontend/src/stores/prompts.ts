import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Prompt, PromptVersion } from '@/types'
import api from './api'

export const usePromptsStore = defineStore('prompts', () => {
  // State
  const prompts = ref<Prompt[]>([])
  const currentPrompt = ref<Prompt | null>(null)
  const promptVersions = ref<PromptVersion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const promptCount = computed(() => prompts.value.length)
  const promptsByProject = computed(() => {
    return (projectId: string) => {
      // 这里需要通过table_id来查找对应的project_id
      // 由于前端没有直接关联，我们需要通过API获取
      // 暂时返回所有提示词，实际应该通过API过滤
      return prompts.value
    }
  })

  // Actions
  const fetchPrompts = async (projectId?: string) => {
    loading.value = true
    error.value = null
    try {
      const url = projectId ? `/prompts?project_id=${projectId}` : '/prompts'
      prompts.value = await api.get(url)
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  const fetchPrompt = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const prompt = await api.get(`/prompts/${id}`)
      currentPrompt.value = prompt
      return prompt
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createPrompt = async (promptData: Omit<Prompt, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>) => {
    loading.value = true
    error.value = null
    try {
      const newPrompt = await api.post('/prompts', promptData)
      prompts.value.push(newPrompt)
      return newPrompt
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePrompt = async (id: string, promptData: Partial<Prompt>) => {
    loading.value = true
    error.value = null
    try {
      const updatedPrompt = await api.put(`/prompts/${id}`, promptData)
      const index = prompts.value.findIndex((p: Prompt) => p.id === id)
      if (index !== -1) {
        prompts.value[index] = updatedPrompt
      }
      if (currentPrompt.value?.id === id) {
        currentPrompt.value = updatedPrompt
      }
      return updatedPrompt
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePrompt = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/prompts/${id}`)
      prompts.value = prompts.value.filter((p: Prompt) => p.id !== id)
      if (currentPrompt.value?.id === id) {
        currentPrompt.value = null
      }
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchPromptVersions = async (promptId: string) => {
    loading.value = true
    error.value = null
    try {
      promptVersions.value = await api.get(`/prompts/${promptId}/versions`)
      return promptVersions.value
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createPromptVersion = async (promptId: string, versionData: Omit<PromptVersion, 'id' | 'created_at' | 'is_deleted'>) => {
    loading.value = true
    error.value = null
    try {
      const newVersion = await api.post(`/prompts/${promptId}/versions`, versionData)
      promptVersions.value.push(newVersion)
      return newVersion
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentPrompt = (prompt: Prompt | null) => {
    currentPrompt.value = prompt
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    prompts,
    currentPrompt,
    promptVersions,
    loading,
    error,
    
    // Getters
    promptCount,
    promptsByProject,
    
    // Actions
    fetchPrompts,
    fetchPrompt,
    createPrompt,
    updatePrompt,
    deletePrompt,
    fetchPromptVersions,
    createPromptVersion,
    setCurrentPrompt,
    clearError
  }
})