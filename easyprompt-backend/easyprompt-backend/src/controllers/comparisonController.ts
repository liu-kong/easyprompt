import { Request, Response } from 'express';
import { ComparisonService } from '../services/comparisonService';

export class ComparisonController {
  private comparisonService: ComparisonService;

  constructor() {
    this.comparisonService = new ComparisonService();
  }

  compareTables = async (req: Request, res: Response) => {
    try {
      const { tableId1, tableId2 } = req.params;
      const result = await this.comparisonService.compareTables(
        Number(tableId1),
        Number(tableId2)
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  comparePromptVersions = async (req: Request, res: Response) => {
    try {
      const { promptId, version1, version2 } = req.params;
      const result = await this.comparisonService.comparePromptVersions(
        Number(promptId),
        version1,
        version2
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getTableStatistics = async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const statistics = await this.comparisonService.getTableStatistics(Number(tableId));
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getProjectStatistics = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const statistics = await this.comparisonService.getProjectStatistics(Number(projectId));
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}