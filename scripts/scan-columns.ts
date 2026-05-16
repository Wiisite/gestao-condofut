import { Pool } from 'pg';
import 'dotenv/config';

async function scanTable(tableName: string) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    console.log(`Columns in ${tableName}:`);
    res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
  } catch (err) {
    console.error(`Error scanning table ${tableName}:`, err);
  } finally {
    await pool.end();
  }
}

async function run() {
  await scanTable('configuracoes_sistema');
}

run();
