import { Knex } from 'knex';
import { Prompt, ComparisonResult } from '../models';
import { DatabaseManager } from '../database/connection';

export class ComparisonService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async compareTables(tableId1: number, tableId2: number): Promise<ComparisonResult> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const table1Info = await connection('prompt_tables').where('id', tableId1).first();
    const table2Info = await connection('prompt_tables').where('id', tableId2).first();

    if (!table1Info || !table2Info) {
      throw new Error('One or both tables not found');
    }

    const prompts1 = await connection('prompts').where('table_id', tableId1);
    const prompts2 = await connection('prompts').where('table_id', tableId2);

    const differences: ComparisonResult['differences'] = [];

    // 创建提示词映射以便快速查找
    const prompts1Map = new Map(prompts1.map(p => [p.code, p]));
    const prompts2Map = new Map(prompts2.map(p => [p.code, p]));

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
        if (prompt1.title !== prompt2.title) {
          differences.push({
            code,
            field: 'title',
            value1: prompt1.title,
            value2: prompt2.title,
          });
        }

        // 比较内容
        if (prompt1.content !== prompt2.content) {
          differences.push({
            code,
            field: 'content',
            value1: prompt1.content,
            value2: prompt2.content,
          });
        }

        // 比较版本
        if (prompt1.version !== prompt2.version) {
          differences.push({
            code,
            field: 'version',
            value1: prompt1.version,
            value2: prompt2.version,
          });
        }

        // 比较标签
        if (prompt1.tags !== prompt2.tags) {
          differences.push({
            code,
            field: 'tags',
            value1: prompt1.tags || '',
            value2: prompt2.tags || '',
          });
        }

        // 比较激活状态
        if (prompt1.is_active !== prompt2.is_active) {
          differences.push({
            code,
            field: 'is_active',
            value1: prompt1.is_active,
            value2: prompt2.is_active,
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

  async comparePromptVersions(promptId: number, version1: string, version2: string): Promise<any> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const version1Record = await connection('prompt_versions')
      .where('prompt_id', promptId)
      .where('version', version1)
      .first();

    const version2Record = await connection('prompt_versions')
      .where('prompt_id', promptId)
      .where('version', version2)
      .first();

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

  async getTableStatistics(tableId: number): Promise<any> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const tableInfo = await connection('prompt_tables').where('id', tableId).first();
    if (!tableInfo) {
      throw new Error('Table not found');
    }

    const prompts = await connection('prompts').where('table_id', tableId);
    const activePrompts = prompts.filter(p => p.is_active);
    const versions = await connection('prompt_versions')
      .join('prompts', 'prompt_versions.prompt_id', 'prompts.id')
      .where('prompts.table_id', tableId);

    const tagCounts = new Map<string, number>();
    for (const prompt of prompts) {
      if (prompt.tags) {
        const tags = prompt.tags.split(',').map((t: string) => t.trim());
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
      last_updated: Math.max(...prompts.map(p => new Date(p.updated_at).getTime())),
    };
  }

  async getProjectStatistics(projectId: number): Promise<any> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const projectInfo = await connection('projects').where('id', projectId).first();
    if (!projectInfo) {
      throw new Error('Project not found');
    }

    const tables = await connection('prompt_tables').where('project_id', projectId);
    const tableIds = tables.map(t => t.id);
    
    const prompts = await connection('prompts').whereIn('table_id', tableIds);
    const activePrompts = prompts.filter(p => p.is_active);
    const versions = await connection('prompt_versions')
      .join('prompts', 'prompt_versions.prompt_id', 'prompts.id')
      .whereIn('prompts.table_id', tableIds);

    return {
      project_name: projectInfo.name,
      total_tables: tables.length,
      total_prompts: prompts.length,
      active_prompts: activePrompts.length,
      inactive_prompts: prompts.length - activePrompts.length,
      total_versions: versions.length,
      average_versions_per_prompt: versions.length / prompts.length || 0,
      average_prompts_per_table: prompts.length / tables.length || 0,
      last_updated: Math.max(...prompts.map(p => new Date(p.updated_at).getTime())),
    };
  }
}