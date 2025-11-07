import { Prompt, ComparisonResult } from '../models';
import { LowDbManager } from '../database/lowdb-manager';

export class ComparisonService {
  private dbManager: LowDbManager;

  constructor() {
    this.dbManager = LowDbManager.getInstance();
  }

  async compareTables(tableId1: string, tableId2: string): Promise<ComparisonResult> {
    const db = this.dbManager.getDb();
    const table1Info = db.data?.promptTables.find(t => t.id === tableId1 && !t.is_deleted);
    const table2Info = db.data?.promptTables.find(t => t.id === tableId2 && !t.is_deleted);

    if (!table1Info || !table2Info) {
      throw new Error('One or both tables not found');
    }

    const prompts1 = db.data?.prompts.filter(p => p.table_id === tableId1 && !p.is_deleted) || [];
    const prompts2 = db.data?.prompts.filter(p => p.table_id === tableId2 && !p.is_deleted) || [];

    const differences: ComparisonResult['differences'] = [];

    // 创建提示词映射以便快速查找
    const prompts1Map = new Map(prompts1.map((p: Prompt) => [p.code, p]));
    const prompts2Map = new Map(prompts2.map((p: Prompt) => [p.code, p]));

    // 检查表1中有但表2中没有的提示词
    for (const [code, prompt1] of prompts1Map) {
      if (!prompts2Map.has(code)) {
        differences.push({
          code,
          field: 'existence',
          value1: 'exists',
          value2: 'missing',
        });
      }
    }

    // 检查表2中有但表1中没有的提示词
    for (const [code, prompt2] of prompts2Map) {
      if (!prompts1Map.has(code)) {
        differences.push({
          code,
          field: 'existence',
          value1: 'missing',
          value2: 'exists',
        });
      }
    }

    // 比较共同提示词的字段差异
    for (const [code, prompt1] of prompts1Map) {
      const prompt2 = prompts2Map.get(code);
      if (prompt2) {
        // 比较标题
        if ((prompt1 as Prompt).title !== (prompt2 as Prompt).title) {
          differences.push({
            code,
            field: 'title',
            value1: (prompt1 as Prompt).title,
            value2: (prompt2 as Prompt).title,
          });
        }

        // 比较内容
        if ((prompt1 as Prompt).content !== (prompt2 as Prompt).content) {
          differences.push({
            code,
            field: 'content',
            value1: (prompt1 as Prompt).content,
            value2: (prompt2 as Prompt).content,
          });
        }

        // 比较版本
        if ((prompt1 as Prompt).version !== (prompt2 as Prompt).version) {
          differences.push({
            code,
            field: 'version',
            value1: (prompt1 as Prompt).version,
            value2: (prompt2 as Prompt).version,
          });
        }

        // 比较标签
        if ((prompt1 as Prompt).tags !== (prompt2 as Prompt).tags) {
          differences.push({
            code,
            field: 'tags',
            value1: (prompt1 as Prompt).tags || '',
            value2: (prompt2 as Prompt).tags || '',
          });
        }

        // 比较激活状态
        if ((prompt1 as Prompt).is_active !== (prompt2 as Prompt).is_active) {
          differences.push({
            code,
            field: 'is_active',
            value1: (prompt1 as Prompt).is_active,
            value2: (prompt2 as Prompt).is_active,
          });
        }
      }
    }

    return {
      table1: table1Info.table_name,
      table2: table2Info.table_name,
      differences,
    };
  }

  async comparePromptVersions(promptId: string, version1: string, version2: string): Promise<any> {
    const db = this.dbManager.getDb();
    const version1Record = db.data?.promptVersions.find(v => v.prompt_id === promptId && v.version === version1 && !v.is_deleted);
    const version2Record = db.data?.promptVersions.find(v => v.prompt_id === promptId && v.version === version2 && !v.is_deleted);

    if (!version1Record || !version2Record) {
      throw new Error('One or both versions not found');
    }

    const differences = [];

    if (version1Record.content !== version2Record.content) {
      differences.push({
        field: 'content',
        value1: version1Record.content,
        value2: version2Record.content,
      });
    }

    return {
      prompt_id: promptId,
      version1,
      version2,
      differences,
    };
  }

  async getTableStatistics(tableId: string): Promise<any> {
    const db = this.dbManager.getDb();
    const tableInfo = db.data?.promptTables.find(t => t.id === tableId && !t.is_deleted);
    if (!tableInfo) {
      throw new Error('Table not found');
    }

    const prompts = db.data?.prompts.filter(p => p.table_id === tableId && !p.is_deleted) || [];
    const activePrompts = prompts.filter((p: Prompt) => p.is_active);
    const versions = db.data?.promptVersions.filter(v => {
      const prompt = prompts.find((p: Prompt) => p.id === v.prompt_id);
      return prompt && !v.is_deleted;
    }) || [];

    const tagCounts = new Map<string, number>();
    for (const prompt of prompts) {
      if ((prompt as Prompt).tags) {
        const tags = (prompt as Prompt).tags!.split(',').map((t: string) => t.trim());
        for (const tag of tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }

    return {
      table_name: tableInfo.table_name,
      total_prompts: prompts.length,
      active_prompts: activePrompts.length,
      inactive_prompts: prompts.length - activePrompts.length,
      total_versions: versions.length,
      average_versions_per_prompt: versions.length / prompts.length || 0,
      tag_distribution: Object.fromEntries(tagCounts),
      last_updated: Math.max(...prompts.map((p: Prompt) => new Date(p.updated_at).getTime())),
    };
  }

  async getProjectStatistics(projectId: string): Promise<any> {
    const db = this.dbManager.getDb();
    const projectInfo = db.data?.projects.find(p => p.id === projectId && !p.is_deleted);
    if (!projectInfo) {
      throw new Error('Project not found');
    }

    const tables = db.data?.promptTables.filter(t => t.project_id === projectId && !t.is_deleted) || [];
    const tableIds = tables.map((t: any) => t.id);
    
    const prompts = db.data?.prompts.filter((p: Prompt) => tableIds.includes(p.table_id) && !p.is_deleted) || [];
    const activePrompts = prompts.filter((p: Prompt) => p.is_active);
    const versions = db.data?.promptVersions.filter(v => {
      const prompt = prompts.find((p: Prompt) => p.id === v.prompt_id);
      return prompt && !v.is_deleted;
    }) || [];

    return {
      project_name: projectInfo.name,
      total_tables: tables.length,
      total_prompts: prompts.length,
      active_prompts: activePrompts.length,
      inactive_prompts: prompts.length - activePrompts.length,
      total_versions: versions.length,
      average_versions_per_prompt: versions.length / prompts.length || 0,
      average_prompts_per_table: prompts.length / tables.length || 0,
      last_updated: Math.max(...prompts.map((p: Prompt) => new Date(p.updated_at).getTime())),
    };
  }
}