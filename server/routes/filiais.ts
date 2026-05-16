import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth } from "../auth";

const router = Router();

// Filiais routes - permitindo acesso público para a página de unidades
router.get("/", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    let filiaisData = await storage.getFiliais();
    
    // Se for um gestor de unidade (e não admin), filtrar apenas para sua unidade
    if (isGestor && !isAdmin) {
      filiaisData = filiaisData.filter(filial => filial.id === req.session.filialId);
    }
    
    // Sanitizar dados: remover campos sensíveis como a senha
    const sanitizedFiliais = filiaisData.map(({ senha, ...rest }: any) => rest);
    
    res.json(sanitizedFiliais);
  } catch (error) {
    console.error("Error fetching filiais:", error);
    res.status(500).json({ message: "Failed to fetch filiais" });
  }
});

router.get("/detalhadas", requireAdminAuth, async (req, res) => {
  try {
    const filiais = await storage.getFiliaisDetalhadas();
    res.json(filiais);
  } catch (error) {
    console.error("Error fetching detailed filiais:", error);
    res.status(500).json({ message: "Failed to fetch detailed filiais" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const filial = await storage.getFilial(id);
    if (!filial) {
      return res.status(404).json({ message: "Filial not found" });
    }
    res.json(filial);
  } catch (error) {
    console.error("Error fetching filial:", error);
    res.status(500).json({ message: "Failed to fetch filial" });
  }
});

// Endpoints públicos para a página de detalhes da unidade
router.get("/public/:id/professores", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const professores = await storage.getProfessoresByFilial(id);
    const sanitized = professores.filter(p => p.ativo !== false).map(({ cpf, rg, ...rest }: any) => rest);
    res.json(sanitized);
  } catch (error) {
    console.error("Error fetching public professores:", error);
    res.status(500).json({ message: "Failed to fetch professores" });
  }
});

router.get("/public/:id/turmas", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const turmas = await storage.getTurmasByFilial(id);
    const sanitized = turmas.filter(t => t.ativo !== false);
    res.json(sanitized);
  } catch (error) {
    console.error("Error fetching public turmas:", error);
    res.status(500).json({ message: "Failed to fetch turmas" });
  }
});

// POST filial
router.post("/", requireAdminAuth, async (req, res) => {
  try {
    const filialData = req.body;
    const filial = await storage.createFilial(filialData);
    res.status(201).json(filial);
  } catch (error) {
    console.error("Error creating filial:", error);
    res.status(500).json({ message: "Failed to create filial" });
  }
});

// PUT filial
router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const filialData = req.body;
    const filial = await storage.updateFilial(id, filialData);
    res.json(filial);
  } catch (error) {
    console.error("Error updating filial:", error);
    res.status(500).json({ message: "Failed to update filial" });
  }
});

// DELETE filial
router.delete("/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteFilial(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting filial:", error);
    res.status(500).json({ message: "Failed to delete filial" });
  }
});

export default router;
