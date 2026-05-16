import { Pool } from 'pg';
import 'dotenv/config';

async function scan() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found");
    return;
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Tables in database:");
    res.rows.forEach(row => console.log("- " + row.table_name));
    
    // Check if tournament related tables exist even if not in schema.ts
    const tournamentTables = res.rows.filter(row => 
      row.table_name.includes('torneio') || 
      row.table_name.includes('sumula') || 
      row.table_name.includes('match') ||
      row.table_name.includes('elenco')
    );
    
    if (tournamentTables.length > 0) {
      console.log("\nTournament related tables found:");
      tournamentTables.forEach(row => console.log("- " + row.table_name));
    } else {
      console.log("\nNo tournament related tables found in database.");
    }

  } catch (err) {
    console.error("Error connecting to database:", err);
  } finally {
    await pool.end();
  }
}

scan();
