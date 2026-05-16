import { Pool } from 'pg';
import 'dotenv/config';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT * FROM configuracoes_sistema");
    console.log(`Found ${res.rows.length} config records.`);
    if (res.rows.length > 0) {
      console.log("Current config:", JSON.stringify(res.rows[0], null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
