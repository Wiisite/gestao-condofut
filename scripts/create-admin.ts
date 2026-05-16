import { db } from "../server/db";
import { adminUsers } from "../shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function createAdmin() {
  console.log("Criando usuário Super Administrador...");

  // Super Admin - CondoFut
  const email = process.env.ADMIN_EMAIL || "apefia1998@gmail.com";
  const senha = process.env.ADMIN_PASSWORD || "@coi3340MOC@";
  const nome = process.env.ADMIN_NAME || "apefi";
  const papel = "super_admin";

  // Hash da senha
  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    // Verificar se já existe
    const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email));

    if (existing.length > 0) {
      // Atualizar para super_admin se já existe
      await db.update(adminUsers)
        .set({ papel: papel, nome: nome })
        .where(eq(adminUsers.email, email));
      console.log("✅ Usuário admin atualizado para super_admin!");
      console.log(`Email: ${email}`);
    } else {
      // Criar usuário super_admin
      await db.insert(adminUsers).values({
        nome: nome,
        email: email,
        senha: senhaHash,
        ativo: true,
        papel: papel,
      });

      console.log("✅ Usuário Super Admin criado com sucesso!");
      console.log(`Email: ${email}`);
      console.log(`Senha: ${senha}`);
    }
  } catch (error) {
    console.error("Erro ao criar admin:", error);
  }

  process.exit(0);
}

createAdmin();
