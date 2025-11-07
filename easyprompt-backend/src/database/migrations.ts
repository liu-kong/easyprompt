import { Knex } from 'knex';

export async function createTables(connection: Knex): Promise<void> {
  // 创建项目表
  await connection.schema.hasTable('projects').then(async (exists) => {
    if (!exists) {
      await connection.schema.createTable('projects', (table) => {
        table.string('id').primary().defaultTo(connection.raw("(strftime('%s', 'now') || substr(strftime('%f', 'now'), 4)) || substr(randomblob(16), 1, 8)"));
        table.string('name').notNullable();
        table.text('description');
        table.boolean('is_deleted').defaultTo(false);
        table.timestamp('created_at').defaultTo(connection.fn.now());
        table.timestamp('updated_at').defaultTo(connection.fn.now());
      });
    }
  });

  // 创建数据库配置表
  await connection.schema.hasTable('database_configs').then(async (exists) => {
    if (!exists) {
      await connection.schema.createTable('database_configs', (table) => {
        table.string('id').primary().defaultTo(connection.raw("(strftime('%s', 'now') || substr(strftime('%f', 'now'), 4)) || substr(randomblob(16), 1, 8)"));
        table.string('name').notNullable();
        table.enum('type', ['mysql', 'postgresql', 'sqlite']).notNullable();
        table.string('host');
        table.integer('port');
        table.string('database').notNullable();
        table.string('username');
        table.string('password');
        table.string('filename'); // for sqlite
        table.boolean('is_deleted').defaultTo(false);
        table.timestamp('created_at').defaultTo(connection.fn.now());
        table.timestamp('updated_at').defaultTo(connection.fn.now());
      });
    }
  });

  // 创建提示词表
  await connection.schema.hasTable('prompt_tables').then(async (exists) => {
    if (!exists) {
      await connection.schema.createTable('prompt_tables', (table) => {
        table.string('id').primary().defaultTo(connection.raw("(strftime('%s', 'now') || substr(strftime('%f', 'now'), 4)) || substr(randomblob(16), 1, 8)"));
        table.string('project_id').references('id').inTable('projects').onDelete('CASCADE');
        table.string('name').notNullable();
        table.string('table_name').notNullable();
        table.text('description');
        table.boolean('is_deleted').defaultTo(false);
        table.timestamp('created_at').defaultTo(connection.fn.now());
        table.timestamp('updated_at').defaultTo(connection.fn.now());
        table.unique(['project_id', 'table_name']);
      });
    }
  });

  // 创建提示词内容表
  await connection.schema.hasTable('prompts').then(async (exists) => {
    if (!exists) {
      await connection.schema.createTable('prompts', (table) => {
        table.string('id').primary().defaultTo(connection.raw("(strftime('%s', 'now') || substr(strftime('%f', 'now'), 4)) || substr(randomblob(16), 1, 8)"));
        table.string('table_id').references('id').inTable('prompt_tables').onDelete('CASCADE');
        table.string('code').notNullable();
        table.string('title').notNullable();
        table.text('content').notNullable();
        table.string('version').notNullable().defaultTo('1.0.0');
        table.text('tags');
        table.boolean('is_active').defaultTo(true);
        table.boolean('is_deleted').defaultTo(false);
        table.timestamp('created_at').defaultTo(connection.fn.now());
        table.timestamp('updated_at').defaultTo(connection.fn.now());
        table.unique(['table_id', 'code']);
      });
    }
  });

  // 创建提示词版本历史表
  await connection.schema.hasTable('prompt_versions').then(async (exists) => {
    if (!exists) {
      await connection.schema.createTable('prompt_versions', (table) => {
        table.string('id').primary().defaultTo(connection.raw("(strftime('%s', 'now') || substr(strftime('%f', 'now'), 4)) || substr(randomblob(16), 1, 8)"));
        table.string('prompt_id').references('id').inTable('prompts').onDelete('CASCADE');
        table.string('version').notNullable();
        table.text('content').notNullable();
        table.text('change_log');
        table.boolean('is_deleted').defaultTo(false);
        table.timestamp('created_at').defaultTo(connection.fn.now());
        table.index(['prompt_id', 'version']);
      });
    }
  });
}

export async function updateExistingTables(connection: Knex): Promise<void> {
  // 更新现有表结构，添加缺失的字段
  
  // 检查并更新 projects 表
  await connection.schema.hasTable('projects').then(async (exists) => {
    if (exists) {
      await connection.schema.hasColumn('projects', 'is_deleted').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('projects', (table) => {
            table.boolean('is_deleted').defaultTo(false);
          });
        }
      });
      
      await connection.schema.hasColumn('projects', 'created_at').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('projects', (table) => {
            table.timestamp('created_at').defaultTo(connection.fn.now());
          });
        }
      });
      
      await connection.schema.hasColumn('projects', 'updated_at').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('projects', (table) => {
            table.timestamp('updated_at').defaultTo(connection.fn.now());
          });
        }
      });
    }
  });
  
  // 检查并更新 database_configs 表
  await connection.schema.hasTable('database_configs').then(async (exists) => {
    if (exists) {
      await connection.schema.hasColumn('database_configs', 'is_deleted').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('database_configs', (table) => {
            table.boolean('is_deleted').defaultTo(false);
          });
        }
      });
      
      await connection.schema.hasColumn('database_configs', 'created_at').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('database_configs', (table) => {
            table.timestamp('created_at').defaultTo(connection.fn.now());
          });
        }
      });
      
      await connection.schema.hasColumn('database_configs', 'updated_at').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('database_configs', (table) => {
            table.timestamp('updated_at').defaultTo(connection.fn.now());
          });
        }
      });
    }
  });
  
  // 检查并更新 prompt_tables 表
  await connection.schema.hasTable('prompt_tables').then(async (exists) => {
    if (exists) {
      await connection.schema.hasColumn('prompt_tables', 'is_deleted').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('prompt_tables', (table) => {
            table.boolean('is_deleted').defaultTo(false);
          });
        }
      });
      
      await connection.schema.hasColumn('prompt_tables', 'created_at').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('prompt_tables', (table) => {
            table.timestamp('created_at').defaultTo(connection.fn.now());
          });
        }
      });
      
      await connection.schema.hasColumn('prompt_tables', 'updated_at').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('prompt_tables', (table) => {
            table.timestamp('updated_at').defaultTo(connection.fn.now());
          });
        }
      });
    }
  });
  
  // 检查并更新 prompts 表
  await connection.schema.hasTable('prompts').then(async (exists) => {
    if (exists) {
      await connection.schema.hasColumn('prompts', 'is_deleted').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('prompts', (table) => {
            table.boolean('is_deleted').defaultTo(false);
          });
        }
      });
      
      await connection.schema.hasColumn('prompts', 'created_at').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('prompts', (table) => {
            table.timestamp('created_at').defaultTo(connection.fn.now());
          });
        }
      });
      
      await connection.schema.hasColumn('prompts', 'updated_at').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('prompts', (table) => {
            table.timestamp('updated_at').defaultTo(connection.fn.now());
          });
        }
      });
    }
  });
  
  // 检查并更新 prompt_versions 表
  await connection.schema.hasTable('prompt_versions').then(async (exists) => {
    if (exists) {
      await connection.schema.hasColumn('prompt_versions', 'is_deleted').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('prompt_versions', (table) => {
            table.boolean('is_deleted').defaultTo(false);
          });
        }
      });
      
      await connection.schema.hasColumn('prompt_versions', 'created_at').then(async (hasColumn) => {
        if (!hasColumn) {
          await connection.schema.table('prompt_versions', (table) => {
            table.timestamp('created_at').defaultTo(connection.fn.now());
          });
        }
      });
    }
  });
}

export async function createPromptTable(connection: Knex, tableName: string): Promise<void> {
  await connection.schema.hasTable(tableName).then(async (exists) => {
    if (!exists) {
      await connection.schema.createTable(tableName, (table) => {
        table.string('id').primary().defaultTo(connection.raw("(strftime('%s', 'now') || substr(strftime('%f', 'now'), 4)) || substr(randomblob(16), 1, 8)"));
        table.string('code').notNullable().unique();
        table.string('title').notNullable();
        table.text('content').notNullable();
        table.string('version').notNullable().defaultTo('1.0.0');
        table.text('tags');
        table.boolean('is_active').defaultTo(true);
        table.boolean('is_deleted').defaultTo(false);
        table.timestamp('created_at').defaultTo(connection.fn.now());
        table.timestamp('updated_at').defaultTo(connection.fn.now());
      });
    }
  });
}

export async function dropTable(connection: Knex, tableName: string): Promise<void> {
  await connection.schema.hasTable(tableName).then(async (exists) => {
    if (exists) {
      await connection.schema.dropTable(tableName);
    }
  });
}