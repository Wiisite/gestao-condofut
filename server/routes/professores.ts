import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth } from "../auth";

const router = Router();

// Professores routes
router.get("/", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let professoresData;
    if (isAdmin) {
      const filialId = req.query.filialId ? parseInt(req.query.filialId as string) : undefined;
      if (filialId) {
        professoresData = await storage.getProfessoresByFilial(filialId);
      } else {
        professoresData = await storage.getProfessores();
      }
    } else {
      professoresData = await storage.getProfessoresByFilial(req.session.filialId!);
    }
    
    res.json(professoresData);
  } catch (error) {
    console.error("Error fetching professores:", error);
    res.status(500).json({ message: "Failed to fetch professores" });
  }
});

router.post("/", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const professorData = req.body;
    if (isGestor && !isAdmin) {
      professorData.filialId = req.session.filialId!;
    }
    
    const professor = await storage.createProfessor(professorData);
    res.status(201).json(professor);
  } catch (error) {
    console.error("Error creating professor:", error);
    res.status(500).json({ message: "Failed to create professor" });
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
    const professor = await storage.updateProfessor(id, req.body);
    res.json(professor);
  } catch (error) {
    console.error("Error updating professor:", error);
    res.status(500).json({ message: "Failed to update professor" });
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
    await storage.deleteProfessor(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting professor:", error);
    res.status(500).json({ message: "Failed to delete professor" });
  }
});

export default router;
