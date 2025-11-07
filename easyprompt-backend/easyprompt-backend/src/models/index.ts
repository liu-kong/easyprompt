export interface Project {
  id: string;
  name: string;
  description?: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PromptTable {
  id: string;
  project_id: string;
  name: string;
  table_name: string;
  description?: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Prompt {
  id: string;
  table_id: string;
  code: string;
  title: string;
  content: string;
  version: string;
  tags?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: string;
  content: string;
  change_log?: string;
  is_deleted: boolean;
  created_at: Date;
}

export interface DatabaseConfig {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filename?: string; // for sqlite
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ComparisonResult {
  table1: string;
  table2: string;
  differences: {
    code: string;
    field: string;
    value1: any;
    value2: any;
  }[];
}

export interface CodeGeneration {
  language: 'python' | 'java' | 'go';
  prompts: Prompt[];
  template: string;
}