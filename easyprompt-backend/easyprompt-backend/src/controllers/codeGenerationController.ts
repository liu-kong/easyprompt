import { Request, Response } from 'express';
import { CodeGenerationService } from '../services/codeGenerationService';

export class CodeGenerationController {
  private codeGenerationService: CodeGenerationService;

  constructor() {
    this.codeGenerationService = new CodeGenerationService();
  }

  generatePythonCode = async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const code = await this.codeGenerationService.generatePythonCode(Number(tableId));
      res.setHeader('Content-Type', 'text/x-python');
      res.setHeader('Content-Disposition', `attachment; filename="prompt_manager_table_${tableId}.py"`);
      res.send(code);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  generateJavaCode = async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const code = await this.codeGenerationService.generateJavaCode(Number(tableId));
      res.setHeader('Content-Type', 'text/x-java-source');
      res.setHeader('Content-Disposition', `attachment; filename="PromptManager_table_${tableId}.java"`);
      res.send(code);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  generateGoCode = async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const code = await this.codeGenerationService.generateGoCode(Number(tableId));
      res.setHeader('Content-Type', 'text/x-go');
      res.setHeader('Content-Disposition', `attachment; filename="prompt_manager_table_${tableId}.go"`);
      res.send(code);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  generateCode = async (req: Request, res: Response) => {
    try {
      const { tableId, language } = req.params;
      const code = await this.codeGenerationService.generateCode(
        Number(tableId),
        language as 'python' | 'java' | 'go'
      );
      
      let contentType = 'text/plain';
      let extension = 'txt';
      
      switch (language) {
        case 'python':
          contentType = 'text/x-python';
          extension = 'py';
          break;
        case 'java':
          contentType = 'text/x-java-source';
          extension = 'java';
          break;
        case 'go':
          contentType = 'text/x-go';
          extension = 'go';
          break;
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="prompt_manager_table_${tableId}.${extension}"`);
      res.send(code);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}