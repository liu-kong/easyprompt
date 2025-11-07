import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComparisonResult, TableStatistics, ProjectStatistics } from '@/types'
import api from './api'

export const useComparisonStore = defineStore('comparison', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const comparisonResult = ref<ComparisonResult | null>(null)
  const tableStatistics = ref<TableStatistics[]>([])
  const projectStatistics = ref<ProjectStatistics[]>([])

  // Actions
  const compareTables = async (table1Id: number, table2Id: number) => {
    loading.value = true
    error.value = null
    comparisonResult.value = null
    
    try {
      const response = await api.post('/comparison/tables', {
        table1_id: table1Id,
        table2_id: table2Id
      })
      comparisonResult.value = response.data || response
      return comparisonResult.value
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const comparePromptVersions = async (promptId: number, version1: string, version2: string) => {
    loading.value = true
    error.value = null
    comparisonResult.value = null
    
    try {
      const response = await api.post('/comparison/prompt-versions', {
        prompt_id: promptId,
        version1,
        version2
      })
      comparisonResult.value = response.data || response
      return comparisonResult.value
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const getTableStatistics = async (tableId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/comparison/table/${tableId}/statistics`)
      const stats = response.data || response
      
      // 更新或添加到统计列表中
      const index = tableStatistics.value.findIndex((s: TableStatistics) => s.table_name === stats.table_name)
      if (index !== -1) {
        tableStatistics.value[index] = stats
      } else {
        tableStatistics.value.push(stats)
      }
      
      return stats
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const getProjectStatistics = async (projectId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/comparison/project/${projectId}/statistics`)
      const stats = response.data || response
      
      // 更新或添加到统计列表中
      const index = projectStatistics.value.findIndex((s: ProjectStatistics) => s.project_name === stats.project_name)
      if (index !== -1) {
        projectStatistics.value[index] = stats
      } else {
        projectStatistics.value.push(stats)
      }
      
      return stats
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const getAllTableStatistics = async (projectId?: number) => {
    loading.value = true
    error.value = null
    
    try {
      const url = projectId 
        ? `/comparison/project/${projectId}/table-statistics`
        : '/comparison/table-statistics'
      
      const response = await api.get(url)
      tableStatistics.value = response.data || response
      return tableStatistics.value
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const getAllProjectStatistics = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get('/comparison/project-statistics')
      projectStatistics.value = response.data || response
      return projectStatistics.value
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearResults = () => {
    comparisonResult.value = null
    tableStatistics.value = []
    projectStatistics.value = []
  }

  return {
    // State
    loading,
    error,
    comparisonResult,
    tableStatistics,
    projectStatistics,
    
    // Actions
    compareTables,
    comparePromptVersions,
    getTableStatistics,
    getProjectStatistics,
    getAllTableStatistics,
    getAllProjectStatistics,
    clearError,
    clearResults
  }
})