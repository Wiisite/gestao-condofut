import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Função para adicionar colunas que podem estar faltando
export async function runMigrations() {
  try {
    console.log("Iniciando verificações de esquema...");
    
    // Criar tabela de sessões se não existir (necessária para connect-pg-simple)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      ) WITH (OIDS=FALSE);
      
      -- Adicionar constraint de chave primária se não existir
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_pkey') THEN
          ALTER TABLE "sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        END IF;
      END $$;
      
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
    `).catch(err => {
      console.log("Aviso ao criar tabela de sessões:", err.message);
    });

    // Adicionar coluna imagem_url na tabela uniformes se não existir
    await pool.query(`
      ALTER TABLE uniformes 
      ADD COLUMN IF NOT EXISTS imagem_url TEXT;
    `);

    // Adicionar coluna papel na tabela admin_users se não existir
    await pool.query(`
      ALTER TABLE admin_users 
      ADD COLUMN IF NOT EXISTS papel VARCHAR(50) DEFAULT 'admin';
    `);

    // Adicionar colunas do Mercado Pago
    await pool.query(`
      ALTER TABLE pagamentos 
      ADD COLUMN IF NOT EXISTS mercadopago_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS mercadopago_status VARCHAR(50);
      
      ALTER TABLE inscricoes_eventos
      ADD COLUMN IF NOT EXISTS mercadopago_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS mercadopago_status VARCHAR(50);
      
      ALTER TABLE filiais
      ADD COLUMN IF NOT EXISTS foto_fundo_url TEXT,
      ADD COLUMN IF NOT EXISTS is_matriz BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT TRUE;
    `);

    console.log("Migrations verificadas com sucesso");
  } catch (error) {
    console.error("Erro ao executar migrações automáticas:", error);
  }
}