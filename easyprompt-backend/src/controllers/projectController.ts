import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  createProject = async (req: Request, res: Response) => {
    try {
      const project = await this.projectService.createProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getProjects = async (req: Request, res: Response) => {
    try {
      const projects = await this.projectService.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getProjectById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  updateProject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.updateProject(id, req.body);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  deleteProject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.projectService.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createPromptTable = async (req: Request, res: Response) => {
    try {
      const table = await this.projectService.createPromptTable(req.body);
      res.status(201).json(table);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getPromptTables = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const tables = await this.projectService.getPromptTables(projectId);
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getPromptTableById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const table = await this.projectService.getPromptTableById(id);
      
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
      
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  updatePromptTable = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const table = await this.projectService.updatePromptTable(id, req.body);
      
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
      
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  deletePromptTable = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.projectService.deletePromptTable(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Table not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}