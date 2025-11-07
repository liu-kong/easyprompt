import { Knex } from 'knex';

export async function createDatabaseConfigTable(connection: Knex): Promise<void> {
  const hasTable = await connection.schema.hasTable('database_configs');
  
  if (!hasTable) {
    await connection.schema.createTable('database_configs', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.enum('type', ['sqlite', 'mysql', 'postgresql']).notNullable();
      table.string('host');
      table.integer('port');
      table.string('database').notNullable();
      table.string('username');
      table.string('password');
      table.string('filename');
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
    
    console.log('Created database_configs table');
  }
}

export async function updateDatabaseConfigTable(connection: Knex): Promise<void> {
  const hasTable = await connection.schema.hasTable('database_configs');
  
  if (hasTable) {
    // 检查并添加新字段（如果需要）
    const hasDescription = await connection.schema.hasColumn('database_configs', 'description');
    
    if (!hasDescription) {
      await connection.schema.table('database_configs', (table) => {
        table.string('description').nullable();
      });
      console.log('Added description column to database_configs table');
    }
  }
}