import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from './api';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  modelId: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const useAIModelsStore = defineStore('aiModels', () => {
  // State
  const models = ref<AIModel[]>([]);
  const activeModels = ref<AIModel[]>([]);
  const currentModel = ref<AIModel | null>(null);
  const chatHistory = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeModelCount = computed(() => activeModels.value.length);
  const hasActiveModels = computed(() => activeModelCount.value > 0);
  const getActiveModelById = computed(() => (id: string) => 
    activeModels.value.find(model => model.id === id)
  );

  // Actions
  const fetchModels = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await api.get('/ai-models');
      models.value = response.data.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch models';
      console.error('Error fetching AI models:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchActiveModels = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await api.get('/ai-models/active');
      activeModels.value = response.data.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch active models';
      console.error('Error fetching active AI models:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const getModelById = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await api.get(`/ai-models/${id}`);
      return response.data.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch model';
      console.error('Error fetching AI model:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const addModel = async (modelData: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await api.post('/ai-models', modelData);
      const newModel = response.data.data;
      models.value.push(newModel);
      if (newModel.isActive) {
        activeModels.value.push(newModel);
      }
      return newModel;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add model';
      console.error('Error adding AI model:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const updateModel = async (id: string, updateData: Partial<AIModel>) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await api.put(`/ai-models/${id}`, updateData);
      const updatedModel = response.data.data;
      
      // Update in models array
      const modelIndex = models.value.findIndex(model => model.id === id);
      if (modelIndex !== -1) {
        models.value[modelIndex] = updatedModel;
      }
      
      // Update in activeModels array if needed
      const activeModelIndex = activeModels.value.findIndex(model => model.id === id);
      if (activeModelIndex !== -1) {
        if (updatedModel.isActive) {
          activeModels.value[activeModelIndex] = updatedModel;
        } else {
          activeModels.value.splice(activeModelIndex, 1);
        }
      } else if (updatedModel.isActive) {
        activeModels.value.push(updatedModel);
      }
      
      // Update currentModel if it's the one being updated
      if (currentModel.value?.id === id) {
        currentModel.value = updatedModel;
      }
      
      return updatedModel;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update model';
      console.error('Error updating AI model:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteModel = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      await api.delete(`/ai-models/${id}`);
      
      // Remove from models array
      models.value = models.value.filter(model => model.id !== id);
      
      // Remove from activeModels array
      activeModels.value = activeModels.value.filter(model => model.id !== id);
      
      // Clear currentModel if it's the one being deleted
      if (currentModel.value?.id === id) {
        currentModel.value = null;
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete model';
      console.error('Error deleting AI model:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const callModel = async (request: ChatRequest) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await api.post('/ai-models/chat', request);
      return response.data.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to call model';
      console.error('Error calling AI model:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const initializeDefaultModels = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      await api.post('/ai-models/initialize');
      await fetchModels();
      await fetchActiveModels();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize default models';
      console.error('Error initializing default models:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const setCurrentModel = (model: AIModel | null) => {
    currentModel.value = model;
  };

  const addToChatHistory = (message: ChatMessage) => {
    chatHistory.value.push({
      ...message,
      timestamp: new Date().toISOString()
    });
  };

  const clearChatHistory = () => {
    chatHistory.value = [];
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    models,
    activeModels,
    currentModel,
    chatHistory,
    isLoading,
    error,
    
    // Getters
    activeModelCount,
    hasActiveModels,
    getActiveModelById,
    
    // Actions
    fetchModels,
    fetchActiveModels,
    getModelById,
    addModel,
    updateModel,
    deleteModel,
    callModel,
    initializeDefaultModels,
    setCurrentModel,
    addToChatHistory,
    clearChatHistory,
    clearError
  };
});