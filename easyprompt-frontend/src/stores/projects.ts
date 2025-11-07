import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project } from '@/types'
import api from './api'

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const projectCount = computed(() => projects.value.length)
  const activeProjects = computed(() => projects.value.filter((p: Project) => p.id === currentProject.value?.id))

  // Actions
  const fetchProjects = async () => {
    loading.value = true
    error.value = null
    try {
      projects.value = await api.get('/projects')
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  const fetchProject = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const project = await api.get(`/projects/${id}`)
      currentProject.value = project
      return project
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>) => {
    loading.value = true
    error.value = null
    try {
      const newProject = await api.post('/projects', projectData)
      projects.value.push(newProject)
      return newProject
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    loading.value = true
    error.value = null
    try {
      const updatedProject = await api.put(`/projects/${id}`, projectData)
      const index = projects.value.findIndex((p: Project) => p.id === id)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
      if (currentProject.value?.id === id) {
        currentProject.value = updatedProject
      }
      return updatedProject
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProject = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/projects/${id}`)
      projects.value = projects.value.filter((p: Project) => p.id !== id)
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentProject = (project: Project | null) => {
    currentProject.value = project
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    projects,
    currentProject,
    loading,
    error,
    
    // Getters
    projectCount,
    activeProjects,
    
    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    clearError
  }
})