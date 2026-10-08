process.env.NODE_ENV = 'test';
const { pool, initializeDatabase } = await import('./index.js');
const fs = await import('node:fs');
try {
  const exists = (await pool.query("SELECT to_regclass('products') AS table_name")).rows[0].table_name;
  if (!exists) await pool.query(fs.readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  await initializeDatabase();
  console.log('Database schema is ready.');
} finally { await pool.end(); }
