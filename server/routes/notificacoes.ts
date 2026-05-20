import { Router } from "express";
import { storage } from "../storage";
import { requireResponsavelAuth, requireAdminAuth } from "../auth";
import { insertNotificacaoSchema } from "@shared/schema";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId;
    const adminId = req.session.adminId;

    if (responsavelId) {
      const notificacoes = await storage.getNotificacoesByResponsavel(responsavelId);
      return res.json(notificacoes);
    } else if (adminId) {
      // Admins see all notifications
      const notificacoes = await storage.getNotificacoesAdmin();
      return res.json(notificacoes);
    }

    res.status(401).json({ message: "Não autorizado" });
  } catch (error) {
    console.error("Error fetching notificacoes:", error);
    res.status(500).json({ message: "Erro ao buscar notificações" });
  }
});

router.patch("/:id/lida", requireResponsavelAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.marcarNotificacaoLida(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Erro ao marcar notificação como lida" });
  }
});

// Admin notification routes
router.post("/enviar-todos", requireAdminAuth, async (req, res) => {
  try {
    const { titulo, mensagem, tipo } = req.body;
    const ids = await storage.getResponsaveisIdsTodos();
    
    const notificacoesData = ids.map(id => ({
      responsavelId: id,
      titulo,
      mensagem,
      tipo: tipo || "geral",
      lida: false
    }));

    await storage.createBulkNotificacoes(notificacoesData);
    res.json({ success: true, message: `Notificação enviada para ${ids.length} responsáveis.` });
  } catch (error) {
    console.error("Error sending notifications to all:", error);
    res.status(500).json({ message: "Erro ao enviar notificações" });
  }
});

router.post("/enviar-inadimplentes", requireAdminAuth, async (req, res) => {
  try {
    const { titulo, mensagem, tipo } = req.body;
    const ids = await storage.getResponsaveisIdsInadimplentes();
    
    if (ids.length === 0) {
      return res.json({ success: true, message: "Nenhum responsável inadimplente encontrado." });
    }

    const notificacoesData = ids.map(id => ({
      responsavelId: id,
      titulo,
      mensagem,
      tipo: tipo || "pagamento",
      lida: false
    }));

    await storage.createBulkNotificacoes(notificacoesData);
    res.json({ success: true, message: `Notificação enviada para ${ids.length} inadimplentes.` });
  } catch (error) {
    console.error("Error sending notifications to inadimplentes:", error);
    res.status(500).json({ message: "Erro ao enviar notificações" });
  }
});

export default router;
