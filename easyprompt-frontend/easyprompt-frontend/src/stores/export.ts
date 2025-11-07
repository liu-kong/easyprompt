import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from './api'

export interface ExportOptions {
  format: 'sql' | 'json'
  type: 'insert' | 'update'
  includeVersions?: boolean
  includeInactive?: boolean
}

export const useExportStore = defineStore('export', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const exportResult = ref<string | null>(null)

  // Actions
  const exportProject = async (projectId: number, options: ExportOptions) => {
    loading.value = true
    error.value = null
    exportResult.value = null
    
    try {
      const response = await api.post(`/export/project/${projectId}`, options)
      exportResult.value = response.data || response
      return exportResult.value
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const exportTable = async (tableId: number, options: ExportOptions) => {
    loading.value = true
    error.value = null
    exportResult.value = null
    
    try {
      const response = await api.post(`/export/table/${tableId}`, options)
      exportResult.value = response.data || response
      return exportResult.value
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const exportPrompt = async (promptId: number, options: ExportOptions) => {
    loading.value = true
    error.value = null
    exportResult.value = null
    
    try {
      const response = await api.post(`/export/prompt/${promptId}`, options)
      exportResult.value = response.data || response
      return exportResult.value
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const exportTableSchema = async (tableId: number) => {
    loading.value = true
    error.value = null
    exportResult.value = null
    
    try {
      const response = await api.get(`/export/table/${tableId}/schema`)
      exportResult.value = response.data || response
      return exportResult.value
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const downloadExport = (filename: string) => {
    if (!exportResult.value) {
      error.value = '没有可下载的导出内容'
      return
    }

    try {
      const blob = new Blob([exportResult.value], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      error.value = `下载失败: ${(err as Error).message}`
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearResult = () => {
    exportResult.value = null
  }

  return {
    // State
    loading,
    error,
    exportResult,
    
    // Actions
    exportProject,
    exportTable,
    exportPrompt,
    exportTableSchema,
    downloadExport,
    clearError,
    clearResult
  }
})