import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth } from "../auth";
import { db } from "../db";
import { adminUsers, adminInvites } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcrypt";

const router = Router();

// Middleware para verificar se é super_admin
const requireSuperAdmin = async (req: any, res: any, next: any) => {
  if (!req.session?.adminUser || req.session.adminUser.papel !== "super_admin") {
    return res.status(403).json({ message: "Acesso negado. Apenas Super Admins." });
  }
  next();
};

// Dashboard & Metrics
router.get("/metrics", requireAdminAuth, async (req, res) => {
  try {
    const stats = await storage.getDashboardMetrics();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
});

// System Configuration
router.get('/configuracoes', async (req, res) => {
  try {
    const config = await storage.getConfiguracoes();
    res.json(config);
  } catch (error) {
    console.error("Error fetching config:", error);
    res.status(500).json({ message: "Erro ao buscar configurações" });
  }
});

router.put('/configuracoes', requireAdminAuth, async (req, res) => {
  try {
    const config = await storage.updateConfiguracoes(req.body);
    res.json(config);
  } catch (error) {
    console.error("Error updating config:", error);
    res.status(500).json({ message: "Erro ao atualizar configurações" });
  }
});

router.post('/configuracoes/logo', requireAdminAuth, async (req, res) => {
  try {
    const { logoUrl } = req.body;
    const config = await storage.updateConfiguracoes({ logoUrl });
    res.json(config);
  } catch (error) {
    console.error("Error updating logo:", error);
    res.status(500).json({ message: "Erro ao atualizar logo" });
  }
});

// Sync Status
router.get("/sync-status", requireAdminAuth, async (req, res) => {
  try {
    // Mock temporário para status de sincronização
    const status = { lastSync: new Date().toISOString(), status: 'active', itemsPending: 0 };
    res.json(status);
  } catch (error) {
    console.error("Error fetching sync status:", error);
    res.status(500).json({ message: "Failed to fetch sync status" });
  }
});

// ==================== GERENCIAMENTO DE ADMINS ====================

// Listar todos os admins (apenas super_admin)
router.get("/users", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const users = await db.select({
      id: adminUsers.id,
      nome: adminUsers.nome,
      email: adminUsers.email,
      papel: adminUsers.papel,
      ativo: adminUsers.ativo,
      ultimoLogin: adminUsers.ultimoLogin,
      createdAt: adminUsers.createdAt,
    }).from(adminUsers);
    res.json(users);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ message: "Erro ao buscar administradores" });
  }
});

// Criar novo admin (apenas super_admin)
router.post("/users", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { nome, email, senha, papel } = req.body;
    
    // Verificar se email já existe
    const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ message: "Este email já está cadastrado" });
    }
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const [newUser] = await db.insert(adminUsers).values({
      nome,
      email,
      senha: senhaHash,
      papel: papel || "admin",
      ativo: true,
    }).returning();
    
    res.json({ id: newUser.id, nome: newUser.nome, email: newUser.email, papel: newUser.papel });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({ message: "Erro ao criar administrador" });
  }
});

// Atualizar admin (ativar/desativar)
router.patch("/users/:id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    await db.update(adminUsers)
      .set({ ativo, updatedAt: new Date() })
      .where(eq(adminUsers.id, parseInt(id)));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({ message: "Erro ao atualizar administrador" });
  }
});

// ==================== CONVITES ====================

// Listar convites (apenas super_admin)
router.get("/invites", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const invites = await db.select().from(adminInvites);
    res.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    res.status(500).json({ message: "Erro ao buscar convites" });
  }
});

// Criar convite (apenas super_admin)
router.post("/invites", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { email, papel } = req.body;
    const token = crypto.randomBytes(32).toString("hex");
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7); // Expira em 7 dias
    
    const [invite] = await db.insert(adminInvites).values({
      token,
      email: email || null,
      papel: papel || "admin",
      criadoPor: req.session?.adminUser?.id,
      expiraEm,
    }).returning();
    
    res.json(invite);
  } catch (error) {
    console.error("Error creating invite:", error);
    res.status(500).json({ message: "Erro ao criar convite" });
  }
});

// Excluir convite
router.delete("/invites/:id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(adminInvites).where(eq(adminInvites.id, parseInt(id)));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting invite:", error);
    res.status(500).json({ message: "Erro ao excluir convite" });
  }
});

export default router;
