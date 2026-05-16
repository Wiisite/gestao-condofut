import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkAndFixAdmin() {
  try {
    // Verificar usuários existentes
    const result = await pool.query("SELECT id, nome, email FROM admin_users");
    console.log("Usuários admin existentes:", result.rows);

    // Deletar usuário com email errado e criar novo
    await pool.query("DELETE FROM admin_users");
    
    const email = "admin@escolafut.com";
    const senha = "admin123";
    const nome = "Administrador";
    const senhaHash = await bcrypt.hash(senha, 10);

    await pool.query(
      `INSERT INTO admin_users (nome, email, senha, ativo, papel) 
       VALUES ($1, $2, $3, true, 'admin')`,
      [nome, email, senhaHash]
    );

    // Verificar se foi criado corretamente
    const check = await pool.query("SELECT id, nome, email FROM admin_users");
    console.log("\n✅ Usuário admin recriado:");
    console.log(check.rows);
    console.log("\nCredenciais:");
    console.log("Email: admin@escolafut.com");
    console.log("Senha: admin123");

  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
}

checkAndFixAdmin();
