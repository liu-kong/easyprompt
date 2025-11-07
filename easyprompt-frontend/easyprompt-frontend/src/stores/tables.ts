import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PromptTable } from '@/types'
import api from './api'

export const useTablesStore = defineStore('tables', () => {
  // State
  const tables = ref<PromptTable[]>([])
  const currentTable = ref<PromptTable | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const tableCount = computed(() => tables.value.length)
  const tablesByProject = computed(() => {
    return (projectId: string) => tables.value.filter((t: PromptTable) => t.project_id === projectId)
  })

  // Actions
  const fetchTables = async (projectId?: string) => {
    loading.value = true
    error.value = null
    try {
      const url = projectId ? `/tables?project_id=${projectId}` : '/tables'
      tables.value = await api.get(url)
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  const fetchTable = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const table = await api.get(`/tables/${id}`)
      currentTable.value = table
      return table
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTable = async (tableData: Omit<PromptTable, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>) => {
    loading.value = true
    error.value = null
    try {
      const newTable = await api.post('/tables', tableData)
      tables.value.push(newTable)
      return newTable
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTable = async (id: string, tableData: Partial<PromptTable>) => {
    loading.value = true
    error.value = null
    try {
      const updatedTable = await api.put(`/tables/${id}`, tableData)
      const index = tables.value.findIndex((t: PromptTable) => t.id === id)
      if (index !== -1) {
        tables.value[index] = updatedTable
      }
      if (currentTable.value?.id === id) {
        currentTable.value = updatedTable
      }
      return updatedTable
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTable = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/tables/${id}`)
      tables.value = tables.value.filter((t: PromptTable) => t.id !== id)
      if (currentTable.value?.id === id) {
        currentTable.value = null
      }
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentTable = (table: PromptTable | null) => {
    currentTable.value = table
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    tables,
    currentTable,
    loading,
    error,
    
    // Getters
    tableCount,
    tablesByProject,
    
    // Actions
    fetchTables,
    fetchTable,
    createTable,
    updateTable,
    deleteTable,
    setCurrentTable,
    clearError
  }
})