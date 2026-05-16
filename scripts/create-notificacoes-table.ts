import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createNotificacoesTable() {
  console.log("Verificando/criando tabela notificacoes...");
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        responsavel_id INTEGER REFERENCES responsaveis(id),
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        lida BOOLEAN DEFAULT false,
        data_vencimento DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Tabela notificacoes criada/verificada com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

createNotificacoesTable();
