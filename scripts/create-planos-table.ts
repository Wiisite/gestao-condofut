import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createPlanosTable() {
  console.log("Criando tabela planos_financeiros...");
  
  try {
    // Verificar se a tabela já existe
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'planos_financeiros'
      );
    `);
    
    if (tableExists.rows[0]?.exists) {
      console.log("Tabela planos_financeiros já existe!");
      process.exit(0);
    }

    // Criar a tabela
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS planos_financeiros (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        valor_mensal DECIMAL(10, 2) NOT NULL,
        quantidade_meses INTEGER NOT NULL DEFAULT 1,
        desconto_percentual DECIMAL(5, 2) DEFAULT '0',
        valor_total DECIMAL(10, 2),
        dia_vencimento INTEGER DEFAULT 10,
        taxa_matricula DECIMAL(10, 2) DEFAULT '0',
        filial_id INTEGER REFERENCES filiais(id),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Tabela planos_financeiros criada com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao criar tabela:", error);
    process.exit(1);
  }
}

createPlanosTable();
