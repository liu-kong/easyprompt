import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from './api'

export interface CodeGenerationOptions {
  language: 'python' | 'java' | 'go'
  includeVersionControl?: boolean
  includeErrorHandling?: boolean
  includeComments?: boolean
  customTemplate?: string
}

export const useCodeGenerationStore = defineStore('codeGeneration', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const generatedCode = ref<string | null>(null)
  const downloadUrl = ref<string | null>(null)

  // Actions
  const generatePromptCode = async (promptId: number, options: CodeGenerationOptions) => {
    loading.value = true
    error.value = null
    generatedCode.value = null
    downloadUrl.value = null
    
    try {
      const response = await api.post(`/code-generation/prompt/${promptId}`, options)
      const responseData = response.data || response
      generatedCode.value = responseData?.code || responseData
      downloadUrl.value = responseData?.download_url
      return {
        code: generatedCode.value,
        downloadUrl: downloadUrl.value
      }
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateTableCode = async (tableId: number, options: CodeGenerationOptions) => {
    loading.value = true
    error.value = null
    generatedCode.value = null
    downloadUrl.value = null
    
    try {
      const response = await api.post(`/code-generation/table/${tableId}`, options)
      const responseData = response.data || response
      generatedCode.value = responseData?.code || responseData
      downloadUrl.value = responseData?.download_url
      return {
        code: generatedCode.value,
        downloadUrl: downloadUrl.value
      }
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateProjectCode = async (projectId: number, options: CodeGenerationOptions) => {
    loading.value = true
    error.value = null
    generatedCode.value = null
    downloadUrl.value = null
    
    try {
      const response = await api.post(`/code-generation/project/${projectId}`, options)
      const responseData = response.data || response
      generatedCode.value = responseData?.code || responseData
      downloadUrl.value = responseData?.download_url
      return {
        code: generatedCode.value,
        downloadUrl: downloadUrl.value
      }
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const downloadCode = (filename: string) => {
    if (!generatedCode.value) {
      error.value = '没有可下载的代码'
      return
    }

    try {
      const blob = new Blob([generatedCode.value], { type: 'text/plain' })
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

  const downloadPackage = async () => {
    if (!downloadUrl.value) {
      error.value = '没有可下载的代码包'
      return
    }

    try {
      const response = await api.get(downloadUrl.value, { responseType: 'blob' })
      const blob = new Blob([response.data])
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'prompt-code.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      error.value = `下载失败: ${(err as Error).message}`
    }
  }

  const copyCode = async () => {
    if (!generatedCode.value) {
      error.value = '没有可复制的代码'
      return
    }

    try {
      await navigator.clipboard.writeText(generatedCode.value)
      return true
    } catch (err) {
      error.value = `复制失败: ${(err as Error).message}`
      return false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearResult = () => {
    generatedCode.value = null
    downloadUrl.value = null
  }

  return {
    // State
    loading,
    error,
    generatedCode,
    downloadUrl,
    
    // Actions
    generatePromptCode,
    generateTableCode,
    generateProjectCode,
    downloadCode,
    downloadPackage,
    copyCode,
    clearError,
    clearResult
  }
})