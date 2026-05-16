import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth } from "../auth";

const router = Router();

// Eventos
router.get("/eventos", async (req, res) => {
  try {
    const eventos = await storage.getEventos();
    res.json(eventos);
  } catch (error) {
    console.error("Error fetching eventos:", error);
    res.status(500).json({ message: "Failed to fetch eventos" });
  }
});

router.post("/eventos", requireAdminAuth, async (req, res) => {
  try {
    const evento = await storage.createEvento(req.body);
    res.status(201).json(evento);
  } catch (error) {
    console.error("Error creating evento:", error);
    res.status(500).json({ message: "Failed to create evento" });
  }
});

router.put("/eventos/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await storage.updateEvento(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Error updating evento:", error);
    res.status(500).json({ message: "Erro ao atualizar evento" });
  }
});

router.delete("/eventos/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteEvento(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting evento:", error);
    res.status(500).json({ message: "Erro ao excluir evento" });
  }
});

// Uniformes
router.get("/uniformes", async (req, res) => {
  try {
    const uniformes = await storage.getUniformes();
    res.json(uniformes);
  } catch (error) {
    console.error("Error fetching uniformes:", error);
    res.status(500).json({ message: "Failed to fetch uniformes" });
  }
});

router.post("/uniformes", requireAdminAuth, async (req, res) => {
  try {
    const uniforme = await storage.createUniforme(req.body);
    res.status(201).json(uniforme);
  } catch (error) {
    console.error("Error creating uniforme:", error);
    res.status(500).json({ message: "Failed to create uniforme" });
  }
});

router.put("/uniformes/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await storage.updateUniforme(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Error updating uniforme:", error);
    res.status(500).json({ message: "Erro ao atualizar uniforme" });
  }
});

router.delete("/uniformes/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteUniforme(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting uniforme:", error);
    res.status(500).json({ message: "Erro ao excluir uniforme" });
  }
});

export default router;
