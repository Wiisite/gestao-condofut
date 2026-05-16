import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth } from "../auth";

const router = Router();

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

export default router;
