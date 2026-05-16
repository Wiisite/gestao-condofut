import { Router } from "express";
import { storage } from "../storage";
import { requireResponsavelAuth } from "../auth";

const router = Router();

router.get("/", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const notificacoes = await storage.getNotificacoesByResponsavel(responsavelId);
    res.json(notificacoes);
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

export default router;
