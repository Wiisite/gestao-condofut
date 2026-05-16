import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function updatePagamentosTable() {
  console.log("Atualizando tabela pagamentos...");
  
  try {
    // Adicionar coluna plano_id se não existir
    await db.execute(sql`
      ALTER TABLE pagamentos 
      ADD COLUMN IF NOT EXISTS plano_id INTEGER REFERENCES planos_financeiros(id);
    `);
    console.log("Coluna plano_id adicionada/verificada.");

    // Adicionar coluna data_vencimento se não existir
    await db.execute(sql`
      ALTER TABLE pagamentos 
      ADD COLUMN IF NOT EXISTS data_vencimento DATE;
    `);
    console.log("Coluna data_vencimento adicionada/verificada.");

    // Adicionar coluna status se não existir
    await db.execute(sql`
      ALTER TABLE pagamentos 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pago';
    `);
    console.log("Coluna status adicionada/verificada.");

    console.log("Tabela pagamentos atualizada com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao atualizar tabela:", error);
    process.exit(1);
  }
}

updatePagamentosTable();
