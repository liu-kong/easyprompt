import { Knex } from 'knex';
import { Prompt, PromptVersion } from '../models';
import { DatabaseManager } from '../database/connection';
import { generateSnowflakeId } from '../utils/snowflake';

export class PromptService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async createPrompt(promptData: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const version = promptData.version || '1.0.0';
    const promptId = generateSnowflakeId();

    const [prompt] = await connection('prompts')
      .insert({
        id: promptId,
        table_id: promptData.table_id,
        code: promptData.code,
        title: promptData.title,
        content: promptData.content,
        version: version,
        tags: promptData.tags,
        is_active: promptData.is_active,
        is_deleted: false,
      })
      .returning('*');

    // 创建版本记录
    await this.createVersion({
      prompt_id: promptId,
      version: version,
      content: prompt.content,
      change_log: 'Initial version',
      is_deleted: false,
    });

    return prompt;
  }

  async getPrompts(tableId?: string): Promise<Prompt[]> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    let query = connection('prompts').where('is_deleted', false);
    if (tableId) {
      query = query.where('table_id', tableId);
    }
    return await query.select('*');
  }

  async getPromptById(id: string): Promise<Prompt | null> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const prompt = await connection('prompts')
      .where('id', id)
      .where('is_deleted', false)
      .first();
    return prompt || null;
  }

  async getPromptByCode(tableId: string, code: string): Promise<Prompt | null> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const prompt = await connection('prompts')
      .where('table_id', tableId)
      .where('code', code)
      .where('is_deleted', false)
      .first();
    return prompt || null;
  }

  async updatePrompt(id: string, promptData: Partial<Prompt>, createVersion: boolean = true, changeLog?: string): Promise<Prompt | null> {
    const connection = this.dbManager.getConnection('default', 'easyprompt');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const existingPrompt = await this.getPromptById(id);
    if (!existingPrompt) {
      return null;
    }

    const [updatedPrompt] = await connection('prompts')
      .where('id', id)
      .where('is_deleted', false)
      .update({
        ...promptData,
        updated_at: new Date(),
      })
      .returning('*');

    // 如果内容发生变化，创建新版本
    if (createVersion && promptData.content && promptData.content !== existingPrompt.content) {
      const newVersion = this.incrementVersion(existingPrompt.version);
      await this.createVersion({
        prompt_id: id,
        version: newVersion,
        content: promptData.content,
        change_log: changeLog || `Updated to version ${newVersion}`,
        is_deleted: false,
      });

      // 更新提示词的版本号
      await connection('prompts')
        .where('id', id)
        .update({ version: newVersion });
    }

    return updatedPrompt || null;
  }

  async deletePrompt(id: string): Promise<boolean> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const deletedCount = await connection('prompts')
      .where('id', id)
      .where('is_deleted', false)
      .update({
        is_deleted: true,
        updated_at: new Date()
      });
    return deletedCount > 0;
  }

  async createVersion(versionData: Omit<PromptVersion, 'id' | 'created_at'>): Promise<PromptVersion> {
    const connection = this.dbManager.getConnection('default', 'easyprompt');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const [version] = await connection('prompt_versions')
      .insert({
        id: generateSnowflakeId(),
        prompt_id: versionData.prompt_id,
        version: versionData.version,
        content: versionData.content,
        change_log: versionData.change_log,
        is_deleted: false,
      })
      .returning('*');

    return version;
  }

  async getVersions(promptId: string): Promise<PromptVersion[]> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    return await connection('prompt_versions')
      .where('prompt_id', promptId)
      .where('is_deleted', false)
      .orderBy('created_at', 'desc')
      .select('*');
  }

  async getVersion(promptId: string, version: string): Promise<PromptVersion | null> {
    const connection = this.dbManager.getConnection('default', 'easyprompt');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const versionRecord = await connection('prompt_versions')
      .where('prompt_id', promptId)
      .where('version', version)
      .where('is_deleted', false)
      .first();
    return versionRecord || null;
  }

  async restoreVersion(promptId: string, version: string): Promise<Prompt | null> {
    const versionRecord = await this.getVersion(promptId, version);
    if (!versionRecord) {
      return null;
    }

    return await this.updatePrompt(promptId, {
      content: versionRecord.content,
    }, false, `Restored to version ${version}`);
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length !== 3) {
      return '1.0.0';
    }

    const [major, minor, patch] = parts.map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  async searchPrompts(query: string, tableId?: string): Promise<Prompt[]> {
    const connection = this.dbManager.getConnection('default', 'easyprompt');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    let dbQuery = connection('prompts')
      .where('is_deleted', false)
      .where(function() {
        this.where('title', 'like', `%${query}%`)
            .orWhere('content', 'like', `%${query}%`)
            .orWhere('code', 'like', `%${query}%`);
      });

    if (tableId) {
      dbQuery = dbQuery.where('table_id', tableId);
    }

    return await dbQuery.select('*');
  }
}