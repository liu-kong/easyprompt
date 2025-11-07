export interface Project {
  id: string
  name: string
  description?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface PromptTable {
  id: string
  project_id: string
  name: string
  table_name: string
  description?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface Prompt {
  id: string
  table_id: string
  code: string
  title: string
  content: string
  version: string
  tags?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface PromptVersion {
  id: string
  prompt_id: string
  version: string
  content: string
  change_log?: string
  is_deleted: boolean
  created_at: string
}

export interface DatabaseConfig {
  id: string
  name: string
  type: 'mysql' | 'postgresql' | 'sqlite'
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  filename?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface ComparisonResult {
  table1: string
  table2: string
  differences: {
    code: string
    field: string
    value1: any
    value2: any
  }[]
}

export interface TableStatistics {
  table_name: string
  total_prompts: number
  active_prompts: number
  inactive_prompts: number
  total_versions: number
  average_versions_per_prompt: number
  tag_distribution: Record<string, number>
  last_updated: number
}

export interface ProjectStatistics {
  project_name: string
  total_tables: number
  total_prompts: number
  active_prompts: number
  inactive_prompts: number
  total_versions: number
  average_versions_per_prompt: number
  average_prompts_per_table: number
  last_updated: number
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}