import { Request, Response } from 'express';
import { ExportService } from '../services/exportService';

export class ExportController {
  private exportService: ExportService;

  constructor() {
    this.exportService = new ExportService();
  }

  exportTableStructure = async (req: Request, res: Response) => {
    try {
      const { tableName, dbConfigName, dbName } = req.params;
      const sql = await this.exportService.exportTableStructure(tableName, dbConfigName, dbName);
      res.setHeader('Content-Type', 'text/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${tableName}_structure.sql"`);
      res.send(sql);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  exportPromptsAsSQL = async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const { operation = 'INSERT' } = req.query;
      const sql = await this.exportService.exportPromptsAsSQL(
        Number(tableId),
        operation as 'INSERT' | 'UPDATE'
      );
      res.setHeader('Content-Type', 'text/sql');
      res.setHeader('Content-Disposition', `attachment; filename="prompts_table_${tableId}.sql"`);
      res.send(sql);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  exportAllTablesAsSQL = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { operation = 'INSERT' } = req.query;
      const sql = await this.exportService.exportAllTablesAsSQL(
        Number(projectId),
        operation as 'INSERT' | 'UPDATE'
      );
      res.setHeader('Content-Type', 'text/sql');
      res.setHeader('Content-Disposition', `attachment; filename="project_${projectId}_export.sql"`);
      res.send(sql);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  exportTableAsJSON = async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const data = await this.exportService.exportTableAsJSON(Number(tableId));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="table_${tableId}_export.json"`);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  exportProjectAsJSON = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const data = await this.exportService.exportProjectAsJSON(Number(projectId));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="project_${projectId}_export.json"`);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}