import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAdmin() {
  const email = "admin@escolafut.com";
  const senha = "admin123";
  const nome = "Administrador";

  // Hash da senha
  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    // Verificar se já existe
    const existing = await pool.query(
      "SELECT id FROM admin_users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      console.log("Usuário admin já existe!");
      console.log(`Email: ${email}`);
      console.log(`Senha: ${senha}`);
    } else {
      // Criar usuário admin
      await pool.query(
        `INSERT INTO admin_users (nome, email, senha, ativo, papel) 
         VALUES ($1, $2, $3, true, 'admin')`,
        [nome, email, senhaHash]
      );

      console.log("✅ Usuário admin criado com sucesso!");
      console.log(`Email: ${email}`);
      console.log(`Senha: ${senha}`);
    }
  } catch (error) {
    console.error("Erro ao criar admin:", error);
  } finally {
    await pool.end();
  }
}

createAdmin();
