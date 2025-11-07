import { Prompt, PromptVersion } from '../models';
import { LowDbManager } from '../database/lowdb-manager';
import { generateSnowflakeId } from '../utils/snowflake';

export class PromptService {
  private dbManager: LowDbManager;

  constructor() {
    this.dbManager = LowDbManager.getInstance();
  }

  async createPrompt(promptData: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt> {
    const db = this.dbManager.getDb();
    const version = promptData.version || '1.0.0';
    const promptId = generateSnowflakeId();

    const prompt: Prompt = {
      id: promptId,
      table_id: promptData.table_id,
      code: promptData.code,
      title: promptData.title,
      content: promptData.content,
      version: version,
      tags: promptData.tags,
      is_active: promptData.is_active,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    db.data?.prompts.push(prompt);

    // 创建版本记录
    await this.createVersion({
      prompt_id: promptId,
      version: version,
      content: prompt.content,
      change_log: 'Initial version',
      is_deleted: false,
    });

    await this.dbManager.save();
    return prompt;
  }

  async getPrompts(tableId?: string): Promise<Prompt[]> {
    const db = this.dbManager.getDb();
    let prompts = db.data?.prompts.filter(p => !p.is_deleted) || [];
    
    if (tableId) {
      prompts = prompts.filter(p => p.table_id === tableId);
    }
    
    return prompts;
  }

  async getPromptById(id: string): Promise<Prompt | null> {
    const db = this.dbManager.getDb();
    const prompt = db.data?.prompts.find(p => p.id === id && !p.is_deleted);
    return prompt || null;
  }

  async getPromptByCode(tableId: string, code: string): Promise<Prompt | null> {
    const db = this.dbManager.getDb();
    const prompt = db.data?.prompts.find(p => p.table_id === tableId && p.code === code && !p.is_deleted);
    return prompt || null;
  }

  async updatePrompt(id: string, promptData: Partial<Prompt>, createVersion: boolean = true, changeLog?: string): Promise<Prompt | null> {
    const db = this.dbManager.getDb();
    const promptIndex = db.data?.prompts.findIndex(p => p.id === id && !p.is_deleted);
    
    if (promptIndex === undefined || promptIndex === -1) {
      return null;
    }

    const existingPrompt = db.data!.prompts[promptIndex];
    const updatedPrompt = {
      ...existingPrompt,
      ...promptData,
      updated_at: new Date(),
    };

    db.data!.prompts[promptIndex] = updatedPrompt;

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
      updatedPrompt.version = newVersion;
      db.data!.prompts[promptIndex] = updatedPrompt;
    }

    await this.dbManager.save();
    return updatedPrompt;
  }

  async deletePrompt(id: string): Promise<boolean> {
    const db = this.dbManager.getDb();
    const promptIndex = db.data?.prompts.findIndex(p => p.id === id && !p.is_deleted);
    
    if (promptIndex === undefined || promptIndex === -1) {
      return false;
    }

    db.data!.prompts[promptIndex].is_deleted = true;
    db.data!.prompts[promptIndex].updated_at = new Date();
    await this.dbManager.save();

    return true;
  }

  async createVersion(versionData: Omit<PromptVersion, 'id' | 'created_at'>): Promise<PromptVersion> {
    const db = this.dbManager.getDb();
    const version: PromptVersion = {
      id: generateSnowflakeId(),
      prompt_id: versionData.prompt_id,
      version: versionData.version,
      content: versionData.content,
      change_log: versionData.change_log,
      is_deleted: false,
      created_at: new Date(),
    };

    db.data?.promptVersions.push(version);
    await this.dbManager.save();

    return version;
  }

  async getVersions(promptId: string): Promise<PromptVersion[]> {
    const db = this.dbManager.getDb();
    return db.data?.promptVersions
      .filter(v => v.prompt_id === promptId && !v.is_deleted)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
  }

  async getVersion(promptId: string, version: string): Promise<PromptVersion | null> {
    const db = this.dbManager.getDb();
    const versionRecord = db.data?.promptVersions.find(v => v.prompt_id === promptId && v.version === version && !v.is_deleted);
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
    const db = this.dbManager.getDb();
    let prompts = db.data?.prompts.filter(p => !p.is_deleted) || [];
    
    // 搜索标题、内容或代码
    prompts = prompts.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.content.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
    );

    if (tableId) {
      prompts = prompts.filter(p => p.table_id === tableId);
    }

    return prompts;
  }
}