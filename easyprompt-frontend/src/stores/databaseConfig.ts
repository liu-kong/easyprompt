import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DatabaseConfig } from '@/types'
import api from './api'

export const useDatabaseConfigStore = defineStore('databaseConfig', () => {
  // State
  const configs = ref<DatabaseConfig[]>([])
  const currentConfig = ref<DatabaseConfig | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const testResult = ref<{ success: boolean; message: string } | null>(null)

  // Getters
  const configCount = computed(() => configs.value.length)
  const activeConfig = computed(() => configs.value.find((c: DatabaseConfig) => c.id === currentConfig.value?.id))

  // Actions
  const fetchConfigs = async () => {
    loading.value = true
    error.value = null
    try {
      configs.value = await api.get('/database-config')
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  const fetchConfig = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const config = await api.get(`/database-config/${id}`)
      currentConfig.value = config
      return config
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createConfig = async (configData: Omit<DatabaseConfig, 'id' | 'created_at' | 'updated_at'>) => {
    loading.value = true
    error.value = null
    try {
      const newConfig = await api.post('/database-config', configData)
      configs.value.push(newConfig)
      return newConfig
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateConfig = async (id: number, configData: Partial<DatabaseConfig>) => {
    loading.value = true
    error.value = null
    try {
      const updatedConfig = await api.put(`/database-config/${id}`, configData)
      const index = configs.value.findIndex((c: DatabaseConfig) => c.id === id)
      if (index !== -1) {
        configs.value[index] = updatedConfig
      }
      if (currentConfig.value?.id === id) {
        currentConfig.value = updatedConfig
      }
      return updatedConfig
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteConfig = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/database-config/${id}`)
      configs.value = configs.value.filter((c: DatabaseConfig) => c.id !== id)
      if (currentConfig.value?.id === id) {
        currentConfig.value = null
      }
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const testConnection = async (configData: Partial<DatabaseConfig>) => {
    loading.value = true
    error.value = null
    testResult.value = null
    
    try {
      const response = await api.post('/database-config/test', configData)
      testResult.value = response.data || response
      return testResult.value
    } catch (err) {
      error.value = (err as Error).message
      testResult.value = {
        success: false,
        message: (err as Error).message
      }
      return testResult.value
    } finally {
      loading.value = false
    }
  }

  const setActiveConfig = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/database-config/${id}/set-active`)
      
      // 更新所有配置的活跃状态
      // 这里假设有一个is_active字段，如果没有，可以忽略这部分
      // configs.value.forEach((config: DatabaseConfig) => {
      //   config.is_active = config.id === id
      // })
      
      return response
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentConfig = (config: DatabaseConfig | null) => {
    currentConfig.value = config
  }

  const clearError = () => {
    error.value = null
  }

  const clearTestResult = () => {
    testResult.value = null
  }

  return {
    // State
    configs,
    currentConfig,
    loading,
    error,
    testResult,
    
    // Getters
    configCount,
    activeConfig,
    
    // Actions
    fetchConfigs,
    fetchConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    testConnection,
    setActiveConfig,
    setCurrentConfig,
    clearError,
    clearTestResult
  }
})