import { LowDbManager } from '../database/lowdb-manager';
import { v4 as uuidv4 } from 'uuid';

export interface RepositoryPrompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  category: string;
  tags: string[];
  author?: string;
  version?: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  rating: number;
  is_public: boolean;
}

export interface RepositoryCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  prompt_count: number;
}

export class RepositoryService {
  private dbManager: LowDbManager;

  constructor() {
    this.dbManager = LowDbManager.getInstance();
  }

  // 获取所有分类
  async getCategories(): Promise<RepositoryCategory[]> {
    try {
      const categories = await this.dbManager.get('repositoryCategories') || [];
      return categories;
    } catch (error) {
      console.error('Error fetching repository categories:', error);
      return [];
    }
  }

  // 获取提示词列表
  async getPrompts(options: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string;
    search?: string;
    sort_by?: 'created_at' | 'updated_at' | 'usage_count' | 'rating';
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<{ prompts: RepositoryPrompt[], total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        tags,
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = options;

      let prompts = await this.dbManager.get('repositoryPrompts') || [];

      // 应用筛选条件
      if (category) {
        prompts = prompts.filter((prompt: RepositoryPrompt) => prompt.category === category);
      }

      if (tags) {
        const filterTags = tags.split(',').map(tag => tag.trim().toLowerCase());
        prompts = prompts.filter((prompt: RepositoryPrompt) => {
          const promptTags = prompt.tags.map(tag => tag.toLowerCase());
          return filterTags.some(filterTag => 
            promptTags.some(promptTag => promptTag.includes(filterTag))
          );
        });
      }

      if (search) {
        const searchLower = search.toLowerCase();
        prompts = prompts.filter((prompt: RepositoryPrompt) => 
          prompt.title.toLowerCase().includes(searchLower) ||
          prompt.content.toLowerCase().includes(searchLower) ||
          (prompt.description && prompt.description.toLowerCase().includes(searchLower))
        );
      }

      // 排序
      prompts.sort((a: RepositoryPrompt, b: RepositoryPrompt) => {
        const aValue = a[sort_by];
        const bValue = b[sort_by];
        
        if (sort_order === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // 分页
      const total = prompts.length;
      const startIndex = (page - 1) * limit;
      const paginatedPrompts = prompts.slice(startIndex, startIndex + limit);

      return {
        prompts: paginatedPrompts,
        total
      };
    } catch (error) {
      console.error('Error fetching repository prompts:', error);
      return { prompts: [], total: 0 };
    }
  }

  // 获取单个提示词详情
  async getPromptById(id: string): Promise<RepositoryPrompt | null> {
    try {
      const prompts = await this.dbManager.get('repositoryPrompts') || [];
      const prompt = prompts.find((p: RepositoryPrompt) => p.id === id);
      
      if (prompt) {
        // 增加使用次数
        await this.incrementUsageCount(id);
        return prompt;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching prompt by ID:', error);
      return null;
    }
  }

  // 增加使用次数
  async incrementUsageCount(id: string): Promise<void> {
    try {
      const prompts = await this.dbManager.get('repositoryPrompts') || [];
      const promptIndex = prompts.findIndex((p: RepositoryPrompt) => p.id === id);
      
      if (promptIndex !== -1) {
        prompts[promptIndex].usage_count += 1;
        prompts[promptIndex].updated_at = new Date().toISOString();
        await this.dbManager.set('repositoryPrompts', prompts);
      }
    } catch (error) {
      console.error('Error incrementing usage count:', error);
    }
  }

  // 添加提示词到仓库
  async addPrompt(prompt: Omit<RepositoryPrompt, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<RepositoryPrompt | null> {
    try {
      const newPrompt: RepositoryPrompt = {
        ...prompt,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0
      };

      const prompts = await this.dbManager.get('repositoryPrompts') || [];
      prompts.push(newPrompt);
      await this.dbManager.set('repositoryPrompts', prompts);

      // 更新分类的提示词计数
      await this.updateCategoryPromptCount(prompt.category);

      return newPrompt;
    } catch (error) {
      console.error('Error adding prompt to repository:', error);
      return null;
    }
  }

  // 更新分类的提示词计数
  async updateCategoryPromptCount(categoryId: string): Promise<void> {
    try {
      const prompts = await this.dbManager.get('repositoryPrompts') || [];
      const count = prompts.filter((p: RepositoryPrompt) => p.category === categoryId).length;
      
      const categories = await this.dbManager.get('repositoryCategories') || [];
      const categoryIndex = categories.findIndex((c: RepositoryCategory) => c.id === categoryId);
      
      if (categoryIndex !== -1) {
        categories[categoryIndex].prompt_count = count;
        await this.dbManager.set('repositoryCategories', categories);
      }
    } catch (error) {
      console.error('Error updating category prompt count:', error);
    }
  }

  // 初始化默认分类和示例提示词
  async initializeRepository(): Promise<void> {
    try {
      // 检查是否已经初始化
      const categories = await this.dbManager.get('repositoryCategories') || [];
      if (categories.length > 0) {
        return; // 已经初始化过
      }

      // 创建默认分类
      const defaultCategories: RepositoryCategory[] = [
        {
          id: 'cat-writing',
          name: '写作助手',
          description: '用于各种写作任务的提示词',
          icon: '✍️',
          prompt_count: 0
        },
        {
          id: 'cat-coding',
          name: '编程开发',
          description: '编程和软件开发相关的提示词',
          icon: '💻',
          prompt_count: 0
        },
        {
          id: 'cat-analysis',
          name: '数据分析',
          description: '数据分析和处理相关的提示词',
          icon: '📊',
          prompt_count: 0
        },
        {
          id: 'cat-creative',
          name: '创意设计',
          description: '创意和设计相关的提示词',
          icon: '🎨',
          prompt_count: 0
        },
        {
          id: 'cat-business',
          name: '商业应用',
          description: '商业和营销相关的提示词',
          icon: '💼',
          prompt_count: 0
        },
        {
          id: 'cat-education',
          name: '教育学习',
          description: '教育和学习相关的提示词',
          icon: '📚',
          prompt_count: 0
        }
      ];

      await this.dbManager.set('repositoryCategories', defaultCategories);

      // 创建示例提示词
      const samplePrompts: RepositoryPrompt[] = [
        {
          id: uuidv4(),
          title: '文章大纲生成器',
          content: '请为以下主题生成一个详细的文章大纲：\n\n主题：{主题}\n目标读者：{目标读者}\n文章长度：{文章长度}\n\n请包含以下部分：\n1. 引言\n2. 主要论点（至少3个）\n3. 每个论点的支持证据\n4. 反驳观点及回应\n5. 结论\n\n请确保大纲逻辑清晰，结构合理。',
          description: '帮助用户为任何主题生成结构化的文章大纲',
          category: 'cat-writing',
          tags: ['写作', '大纲', '结构化', '文章'],
          author: 'EasyPrompt Team',
          version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usage_count: 0,
          rating: 4.5,
          is_public: true
        },
        {
          id: uuidv4(),
          title: '代码审查助手',
          content: '请对以下代码进行全面的审查，重点关注：\n\n代码：\n```\n{代码}\n```\n\n请检查以下方面：\n1. 代码质量和可读性\n2. 潜在的bug和错误\n3. 性能优化建议\n4. 安全性问题\n5. 最佳实践遵循情况\n6. 代码风格一致性\n\n请提供具体的改进建议和修改后的代码示例。',
          description: '帮助开发者进行全面的代码审查，提高代码质量',
          category: 'cat-coding',
          tags: ['代码审查', '质量', '优化', '最佳实践'],
          author: 'EasyPrompt Team',
          version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usage_count: 0,
          rating: 4.7,
          is_public: true
        },
        {
          id: uuidv4(),
          title: '数据分析报告生成器',
          content: '基于以下数据，请生成一份专业的数据分析报告：\n\n数据描述：{数据描述}\n分析目标：{分析目标}\n数据集：{数据集}\n\n报告应包含：\n1. 数据概览和摘要统计\n2. 关键发现和洞察\n3. 数据可视化建议\n4. 趋势分析和预测\n5. 结论和建议\n\n请使用清晰、专业的语言，并确保分析结果准确可靠。',
          description: '帮助用户从数据中提取有价值的洞察并生成专业报告',
          category: 'cat-analysis',
          tags: ['数据分析', '报告', '洞察', '可视化'],
          author: 'EasyPrompt Team',
          version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usage_count: 0,
          rating: 4.6,
          is_public: true
        }
      ];

      await this.dbManager.set('repositoryPrompts', samplePrompts);

      // 更新分类的提示词计数
      for (const category of defaultCategories) {
        await this.updateCategoryPromptCount(category.id);
      }
    } catch (error) {
      console.error('Error initializing repository:', error);
    }
  }

  // 导入提示词
  async importPrompts(prompts: Omit<RepositoryPrompt, 'id' | 'created_at' | 'updated_at' | 'usage_count'>[]): Promise<number> {
    try {
      let importedCount = 0;
      
      for (const promptData of prompts) {
        const newPrompt = await this.addPrompt(promptData);
        if (newPrompt) {
          importedCount++;
        }
      }
      
      return importedCount;
    } catch (error) {
      console.error('Error importing prompts:', error);
      return 0;
    }
  }

  // 获取热门标签
  async getPopularTags(limit: number = 20): Promise<{ tag: string, count: number }[]> {
    try {
      const prompts = await this.dbManager.get('repositoryPrompts') || [];
      const tagCounts: { [key: string]: number } = {};
      
      prompts.forEach((prompt: RepositoryPrompt) => {
        prompt.tags.forEach(tag => {
          const lowerTag = tag.toLowerCase();
          tagCounts[lowerTag] = (tagCounts[lowerTag] || 0) + 1;
        });
      });
      
      return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      return [];
    }
  }
}