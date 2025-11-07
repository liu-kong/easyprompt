import { LowDbManager } from '../database/lowdb-manager';

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

export class AIModelService {
  private dbManager: LowDbManager;

  constructor() {
    this.dbManager = LowDbManager.getInstance();
  }

  // 获取所有AI模型
  async getModels(): Promise<AIModel[]> {
    try {
      const models = await this.dbManager.get('aiModels') || [];
      return models;
    } catch (error) {
      console.error('Error fetching AI models:', error);
      return [];
    }
  }

  // 获取活跃的AI模型
  async getActiveModels(): Promise<AIModel[]> {
    try {
      const models = await this.getModels();
      return models.filter(model => model.isActive);
    } catch (error) {
      console.error('Error fetching active AI models:', error);
      return [];
    }
  }

  // 根据ID获取模型
  async getModelById(id: string): Promise<AIModel | null> {
    try {
      const models = await this.getModels();
      return models.find(model => model.id === id) || null;
    } catch (error) {
      console.error('Error fetching model by ID:', error);
      return null;
    }
  }

  // 添加新模型
  async addModel(modelData: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModel | null> {
    try {
      const models = await this.getModels();
      const newModel: AIModel = {
        ...modelData,
        id: `model_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      models.push(newModel);
      await this.dbManager.set('aiModels', models);
      return newModel;
    } catch (error) {
      console.error('Error adding AI model:', error);
      return null;
    }
  }

  // 更新模型
  async updateModel(id: string, updateData: Partial<AIModel>): Promise<AIModel | null> {
    try {
      const models = await this.getModels();
      const modelIndex = models.findIndex(model => model.id === id);
      
      if (modelIndex === -1) {
        return null;
      }
      
      models[modelIndex] = {
        ...models[modelIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await this.dbManager.set('aiModels', models);
      return models[modelIndex];
    } catch (error) {
      console.error('Error updating AI model:', error);
      return null;
    }
  }

  // 删除模型
  async deleteModel(id: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      const filteredModels = models.filter(model => model.id !== id);
      
      if (filteredModels.length === models.length) {
        return false; // 模型不存在
      }
      
      await this.dbManager.set('aiModels', filteredModels);
      return true;
    } catch (error) {
      console.error('Error deleting AI model:', error);
      return false;
    }
  }

  // 调用AI模型API
  async callModel(request: ChatRequest): Promise<ChatResponse | null> {
    try {
      const model = await this.getModelById(request.modelId);
      if (!model) {
        throw new Error(`Model with ID ${request.modelId} not found`);
      }

      // 根据不同的提供商调用不同的API
      switch (model.provider.toLowerCase()) {
        case 'openai':
          return await this.callOpenAI(model, request);
        case 'anthropic':
          return await this.callAnthropic(model, request);
        case 'google':
          return await this.callGoogle(model, request);
        case 'azure':
          return await this.callAzure(model, request);
        default:
          throw new Error(`Unsupported provider: ${model.provider}`);
      }
    } catch (error) {
      console.error('Error calling AI model:', error);
      return null;
    }
  }

  // 调用OpenAI API
  private async callOpenAI(model: AIModel, request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(model.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.model,
        messages: request.messages,
        temperature: request.temperature || model.temperature,
        max_tokens: request.maxTokens || model.maxTokens,
        stream: request.stream || false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as ChatResponse;
  }

  // 调用Anthropic API
  private async callAnthropic(model: AIModel, request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(model.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': model.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model.model,
        messages: request.messages,
        temperature: request.temperature || model.temperature,
        max_tokens: request.maxTokens || model.maxTokens,
        stream: request.stream || false
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    // 转换Anthropic响应格式为统一格式
    return {
      id: data.id,
      model: model.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: data.content[0]?.text || ''
        },
        finishReason: data.stop_reason
      }],
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      }
    };
  }

  // 调用Google Gemini API
  private async callGoogle(model: AIModel, request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(model.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: request.messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: request.temperature || model.temperature,
          maxOutputTokens: request.maxTokens || model.maxTokens
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    // 转换Google响应格式为统一格式
    return {
      id: `google_${Date.now()}`,
      model: model.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        },
        finishReason: data.candidates?.[0]?.finishReason || 'stop'
      }],
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0)
      }
    };
  }

  // 调用Azure OpenAI API
  private async callAzure(model: AIModel, request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(model.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': model.apiKey
      },
      body: JSON.stringify({
        messages: request.messages,
        temperature: request.temperature || model.temperature,
        max_tokens: request.maxTokens || model.maxTokens,
        stream: request.stream || false
      })
    });

    if (!response.ok) {
      throw new Error(`Azure API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as ChatResponse;
  }

  // 初始化默认模型
  async initializeDefaultModels(): Promise<void> {
    try {
      const existingModels = await this.getModels();
      if (existingModels.length > 0) {
        return; // 已经初始化过
      }

      const defaultModels: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'GPT-4',
          provider: 'OpenAI',
          apiEndpoint: 'https://api.openai.com/v1/chat/completions',
          apiKey: '', // 用户需要配置
          model: 'gpt-4',
          maxTokens: 4096,
          temperature: 0.7,
          topP: 1,
          description: 'OpenAI GPT-4 模型，适合复杂任务和高质量对话',
          isActive: true
        },
        {
          name: 'GPT-3.5 Turbo',
          provider: 'OpenAI',
          apiEndpoint: 'https://api.openai.com/v1/chat/completions',
          apiKey: '', // 用户需要配置
          model: 'gpt-3.5-turbo',
          maxTokens: 4096,
          temperature: 0.7,
          topP: 1,
          description: 'OpenAI GPT-3.5 Turbo 模型，快速响应，适合一般对话',
          isActive: true
        },
        {
          name: 'Claude 3 Sonnet',
          provider: 'Anthropic',
          apiEndpoint: 'https://api.anthropic.com/v1/messages',
          apiKey: '', // 用户需要配置
          model: 'claude-3-sonnet-20240229',
          maxTokens: 4096,
          temperature: 0.7,
          topP: 1,
          description: 'Anthropic Claude 3 Sonnet 模型，平衡性能和质量',
          isActive: true
        },
        {
          name: 'Gemini Pro',
          provider: 'Google',
          apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
          apiKey: '', // 用户需要配置
          model: 'gemini-pro',
          maxTokens: 2048,
          temperature: 0.7,
          topP: 1,
          description: 'Google Gemini Pro 模型，多模态支持',
          isActive: true
        }
      ];

      for (const modelData of defaultModels) {
        await this.addModel(modelData);
      }
    } catch (error) {
      console.error('Error initializing default AI models:', error);
    }
  }
}