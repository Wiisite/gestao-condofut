import "dotenv/config";
import { db } from "../server/db";
import { responsaveis } from "../shared/schema";

async function listResponsaveis() {
  const lista = await db.select().from(responsaveis);
  console.log("Responsáveis cadastrados:");
  lista.forEach(r => {
    console.log(`- ID: ${r.id}, Nome: ${r.nome}, Email: ${r.email}, Senha: ${r.senha}`);
  });
  process.exit(0);
}

listResponsaveis();
