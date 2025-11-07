import { Request, Response } from 'express';
import { PromptService } from '../services/promptService';

export class PromptController {
  private promptService: PromptService;

  constructor() {
    this.promptService = new PromptService();
  }

  createPrompt = async (req: Request, res: Response) => {
    try {
      const prompt = await this.promptService.createPrompt(req.body);
      res.status(201).json(prompt);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getPrompts = async (req: Request, res: Response) => {
    try {
      const { tableId } = req.query;
      const prompts = await this.promptService.getPrompts(tableId ? tableId as string : undefined);
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getPromptById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const prompt = await this.promptService.getPromptById(id);
      
      if (!prompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getPromptByCode = async (req: Request, res: Response) => {
    try {
      const { tableId, code } = req.params;
      const prompt = await this.promptService.getPromptByCode(tableId, code);
      
      if (!prompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  updatePrompt = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { changeLog, ...promptData } = req.body;
      const prompt = await this.promptService.updatePrompt(id, promptData, true, changeLog);
      
      if (!prompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  deletePrompt = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.promptService.deletePrompt(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createVersion = async (req: Request, res: Response) => {
    try {
      const version = await this.promptService.createVersion(req.body);
      res.status(201).json(version);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getVersions = async (req: Request, res: Response) => {
    try {
      const { promptId } = req.params;
      const versions = await this.promptService.getVersions(promptId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getVersion = async (req: Request, res: Response) => {
    try {
      const { promptId, version } = req.params;
      const versionRecord = await this.promptService.getVersion(promptId, version);
      
      if (!versionRecord) {
        return res.status(404).json({ error: 'Version not found' });
      }
      
      res.json(versionRecord);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  restoreVersion = async (req: Request, res: Response) => {
    try {
      const { promptId, version } = req.params;
      const prompt = await this.promptService.restoreVersion(promptId, version);
      
      if (!prompt) {
        return res.status(404).json({ error: 'Prompt or version not found' });
      }
      
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  searchPrompts = async (req: Request, res: Response) => {
    try {
      const { query, tableId } = req.query;
      const prompts = await this.promptService.searchPrompts(
        query as string,
        tableId ? tableId as string : undefined
      );
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}