import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixSessions() {
  try {
    // Dropar a tabela sessions existente e recriar no formato do connect-pg-simple
    await pool.query("DROP TABLE IF EXISTS sessions CASCADE");
    
    // Criar tabela no formato esperado pelo connect-pg-simple
    await pool.query(`
      CREATE TABLE "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    
    await pool.query(`
      CREATE INDEX "IDX_session_expire" ON "session" ("expire")
    `);

    console.log("✅ Tabela de sessões recriada com sucesso!");
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
}

fixSessions();
