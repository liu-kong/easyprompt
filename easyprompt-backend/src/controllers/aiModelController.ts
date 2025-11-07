import { Request, Response } from 'express';
import { AIModelService, AIModel, ChatRequest } from '../services/aiModelService';

export class AIModelController {
  private aiModelService: AIModelService;

  constructor() {
    this.aiModelService = new AIModelService();
  }

  // 获取所有AI模型
  getModels = async (req: Request, res: Response) => {
    try {
      const models = await this.aiModelService.getModels();
      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      console.error('Error fetching AI models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AI models'
      });
    }
  };

  // 获取活跃的AI模型
  getActiveModels = async (req: Request, res: Response) => {
    try {
      const models = await this.aiModelService.getActiveModels();
      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      console.error('Error fetching active AI models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active AI models'
      });
    }
  };

  // 根据ID获取模型
  getModelById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const model = await this.aiModelService.getModelById(id);
      
      if (!model) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }
      
      res.json({
        success: true,
        data: model
      });
    } catch (error) {
      console.error('Error fetching model by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch model'
      });
    }
  };

  // 添加新模型
  addModel = async (req: Request, res: Response) => {
    try {
      const modelData = req.body;
      const newModel = await this.aiModelService.addModel(modelData);
      
      if (!newModel) {
        return res.status(400).json({
          success: false,
          message: 'Failed to add model'
        });
      }
      
      res.status(201).json({
        success: true,
        data: newModel
      });
    } catch (error) {
      console.error('Error adding AI model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add model'
      });
    }
  };

  // 更新模型
  updateModel = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedModel = await this.aiModelService.updateModel(id, updateData);
      
      if (!updatedModel) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }
      
      res.json({
        success: true,
        data: updatedModel
      });
    } catch (error) {
      console.error('Error updating AI model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update model'
      });
    }
  };

  // 删除模型
  deleteModel = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.aiModelService.deleteModel(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Model not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Model deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting AI model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete model'
      });
    }
  };

  // 调用AI模型API
  callModel = async (req: Request, res: Response) => {
    try {
      const chatRequest: ChatRequest = req.body;
      const response = await this.aiModelService.callModel(chatRequest);
      
      if (!response) {
        return res.status(400).json({
          success: false,
          message: 'Failed to call model'
        });
      }
      
      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error calling AI model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to call model',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // 初始化默认模型
  initializeDefaultModels = async (req: Request, res: Response) => {
    try {
      await this.aiModelService.initializeDefaultModels();
      res.json({
        success: true,
        message: 'Default models initialized successfully'
      });
    } catch (error) {
      console.error('Error initializing default models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize default models'
      });
    }
  };
}