import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';

export class DocumentationController {
  private docsPath: string;

  constructor() {
    // 设置文档路径
    this.docsPath = path.join(__dirname, '../../docs');
  }

  // 获取文档结构
  async getDocumentationStructure(req: Request, res: Response) {
    try {
      // 检查文档目录是否存在
      if (!fs.existsSync(this.docsPath)) {
        return res.status(404).json({ error: '文档目录不存在' });
      }

      // 读取文档目录结构
      const structure = this.readDirectoryStructure(this.docsPath);
      res.json(structure);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // 获取文档内容
  async getDocumentationContent(req: Request, res: Response) {
    try {
      const { docPath } = req.params;
      const fullPath = path.join(this.docsPath, `${docPath}.md`);

      // 检查文件是否存在
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: '文档不存在' });
      }

      // 读取文件内容
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 使用 marked 解析 Markdown
      const htmlContent = marked(content);
      
      // 获取文件修改时间
      const stats = fs.statSync(fullPath);
      const lastUpdated = stats.mtime.toISOString();

      res.json({
        title: this.extractTitle(content),
        content: htmlContent,
        lastUpdated
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // 读取目录结构
  private readDirectoryStructure(dirPath: string): any[] {
    const structure: any[] = [];
    
    // 读取目录中的所有文件夹
    const directories = fs.readdirSync(dirPath)
      .filter(file => {
        const fullPath = path.join(dirPath, file);
        return fs.statSync(fullPath).isDirectory();
      })
      .sort();

    for (const dir of directories) {
      const dirFullPath = path.join(dirPath, dir);
      const section: any = {
        title: this.getSectionTitle(dir),
        pages: []
      };

      // 读取文件夹中的所有 .md 文件
      const files = fs.readdirSync(dirFullPath)
        .filter(file => file.endsWith('.md'))
        .sort();

      for (const file of files) {
        const filePath = path.join(dirFullPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);
        
        section.pages.push({
          title: this.extractTitle(content),
          path: file.replace('.md', ''),
          lastUpdated: stats.mtime.toISOString()
        });
      }

      structure.push(section);
    }

    return structure;
  }

  // 从 Markdown 内容中提取标题
  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : '无标题';
  }

  // 获取章节标题
  private getSectionTitle(dirName: string): string {
    const titleMap: Record<string, string> = {
      'getting-started': '快速开始',
      'core-features': '核心功能',
      'advanced': '高级功能',
      'api': 'API 参考'
    };
    
    return titleMap[dirName] || dirName;
  }
}