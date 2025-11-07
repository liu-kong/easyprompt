import { Request, Response } from 'express';
import { RepositoryService } from '../services/repositoryService';

export class RepositoryController {
  private repositoryService: RepositoryService;

  constructor() {
    this.repositoryService = new RepositoryService();
  }

  // 获取所有分类
  getCategories = async (req: Request, res: Response) => {
    try {
      const categories = await this.repositoryService.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching repository categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  };

  // 获取提示词列表
  getPrompts = async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        tags,
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        category: category as string,
        tags: tags as string,
        search: search as string,
        sort_by: sort_by as 'created_at' | 'updated_at' | 'usage_count' | 'rating',
        sort_order: sort_order as 'asc' | 'desc'
      };

      const result = await this.repositoryService.getPrompts(options);
      res.json(result);
    } catch (error) {
      console.error('Error fetching repository prompts:', error);
      res.status(500).json({ error: 'Failed to fetch prompts' });
    }
  };

  // 获取单个提示词详情
  getPromptById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const prompt = await this.repositoryService.getPromptById(id);
      
      if (!prompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      
      res.json(prompt);
    } catch (error) {
      console.error('Error fetching prompt by ID:', error);
      res.status(500).json({ error: 'Failed to fetch prompt' });
    }
  };

  // 添加提示词到仓库
  addPrompt = async (req: Request, res: Response) => {
    try {
      const promptData = req.body;
      const newPrompt = await this.repositoryService.addPrompt(promptData);
      
      if (!newPrompt) {
        return res.status(500).json({ error: 'Failed to add prompt' });
      }
      
      res.status(201).json(newPrompt);
    } catch (error) {
      console.error('Error adding prompt to repository:', error);
      res.status(500).json({ error: 'Failed to add prompt' });
    }
  };

  // 导入提示词
  importPrompts = async (req: Request, res: Response) => {
    try {
      const { prompts } = req.body;
      
      if (!Array.isArray(prompts)) {
        return res.status(400).json({ error: 'Prompts must be an array' });
      }
      
      const importedCount = await this.repositoryService.importPrompts(prompts);
      res.json({ importedCount, message: `Successfully imported ${importedCount} prompts` });
    } catch (error) {
      console.error('Error importing prompts:', error);
      res.status(500).json({ error: 'Failed to import prompts' });
    }
  };

  // 获取热门标签
  getPopularTags = async (req: Request, res: Response) => {
    try {
      const { limit = 20 } = req.query;
      const tags = await this.repositoryService.getPopularTags(parseInt(limit as string));
      res.json(tags);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      res.status(500).json({ error: 'Failed to fetch popular tags' });
    }
  };

  // 初始化仓库
  initializeRepository = async (req: Request, res: Response) => {
    try {
      await this.repositoryService.initializeRepository();
      res.json({ message: 'Repository initialized successfully' });
    } catch (error) {
      console.error('Error initializing repository:', error);
      res.status(500).json({ error: 'Failed to initialize repository' });
    }
  };
}