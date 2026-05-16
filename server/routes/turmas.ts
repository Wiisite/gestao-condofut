import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth } from "../auth";

const router = Router();

// Turmas routes
router.get("/", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let turmasData;
    if (isAdmin) {
      const filialId = req.query.filialId ? parseInt(req.query.filialId as string) : undefined;
      if (filialId) {
        turmasData = await storage.getTurmasByFilial(filialId);
      } else {
        turmasData = await storage.getTurmas();
      }
    } else {
      turmasData = await storage.getTurmasByFilial(req.session.filialId!);
    }
    
    res.json(turmasData);
  } catch (error) {
    console.error("Error fetching turmas:", error);
    res.status(500).json({ message: "Failed to fetch turmas" });
  }
});

router.post("/", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const turmaData = req.body;
    if (isGestor && !isAdmin) {
      turmaData.filialId = req.session.filialId!;
    }
    
    const turma = await storage.createTurma(turmaData);
    res.status(201).json(turma);
  } catch (error) {
    console.error("Error creating turma:", error);
    res.status(500).json({ message: "Failed to create turma" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    const turma = await storage.updateTurma(id, req.body);
    res.json(turma);
  } catch (error) {
    console.error("Error updating turma:", error);
    res.status(500).json({ message: "Failed to update turma" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    await storage.deleteTurma(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting turma:", error);
    res.status(500).json({ message: "Failed to delete turma" });
  }
});

// Matriculas em turmas
router.post("/matriculas", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const matricula = await storage.createMatricula(req.body);
    res.status(201).json(matricula);
  } catch (error) {
    console.error("Error creating matricula:", error);
    res.status(500).json({ message: "Failed to create matricula" });
  }
});

router.delete("/matriculas/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    await storage.deleteMatricula(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting matricula:", error);
    res.status(500).json({ message: "Failed to delete matricula" });
  }
});

export default router;
