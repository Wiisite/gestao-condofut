import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth } from "../auth";

const router = Router();

// Presenças routes
router.get("/presencas", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const presencas = await storage.getPresencas();
    res.json(presencas);
  } catch (error) {
    console.error("Error fetching presencas:", error);
    res.status(500).json({ message: "Failed to fetch presencas" });
  }
});

router.post("/presencas", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const presenca = await storage.createPresenca(req.body);
    res.status(201).json(presenca);
  } catch (error) {
    console.error("Error creating presenca:", error);
    res.status(500).json({ message: "Failed to create presenca" });
  }
});

// Avaliações físicas routes
router.get("/avaliacoes-fisicas", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let avaliacoes;
    if (isAdmin) {
      avaliacoes = await storage.getAvaliacoesFisicas();
    } else {
      avaliacoes = await storage.getAvaliacoesByFilial(req.session.filialId!);
    }
    res.json(avaliacoes);
  } catch (error) {
    console.error("Error fetching avaliacoes fisicas:", error);
    res.status(500).json({ message: "Failed to fetch avaliacoes fisicas" });
  }
});

router.post("/avaliacoes-fisicas", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const avaliacao = await storage.createAvaliacaoFisica(req.body);
    res.status(201).json(avaliacao);
  } catch (error) {
    console.error("Error creating avaliacao fisica:", error);
    res.status(500).json({ message: "Failed to create avaliacao fisica" });
  }
});

router.put("/avaliacoes-fisicas/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    const avaliacao = await storage.updateAvaliacaoFisica(id, req.body);
    res.json(avaliacao);
  } catch (error) {
    console.error("Error updating avaliacao fisica:", error);
    res.status(500).json({ message: "Failed to update avaliacao fisica" });
  }
});

// Pacotes de treino routes
router.get("/pacotes-treino", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    const isResponsavel = req.session.responsavelId;
    
    if (!isAdmin && !isGestor && !isResponsavel) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const pacotes = await storage.getPacotesTreino();
    res.json(pacotes);
  } catch (error) {
    console.error("Error fetching pacotes treino:", error);
    res.status(500).json({ message: "Failed to fetch pacotes treino" });
  }
});

router.post("/pacotes-treino", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const pacote = await storage.createPacoteTreino(req.body);
    res.status(201).json(pacote);
  } catch (error) {
    console.error("Error creating pacote treino:", error);
    res.status(500).json({ message: "Failed to create pacote treino" });
  }
});

router.put("/pacotes-treino/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    const pacote = await storage.updatePacoteTreino(id, req.body);
    res.json(pacote);
  } catch (error) {
    console.error("Error updating pacote treino:", error);
    res.status(500).json({ message: "Failed to update pacote treino" });
  }
});

router.delete("/pacotes-treino/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    await storage.deletePacoteTreino(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting pacote treino:", error);
    res.status(500).json({ message: "Failed to delete pacote treino" });
  }
});

// Assinaturas de pacotes routes
router.get("/assinaturas-pacotes", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const assinaturas = await storage.getAssinaturasPacotes();
    res.json(assinaturas);
  } catch (error) {
    console.error("Error fetching assinaturas pacotes:", error);
    res.status(500).json({ message: "Failed to fetch assinaturas pacotes" });
  }
});

router.post("/assinaturas-pacotes", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const assinatura = await storage.createAssinaturaPacote(req.body);
    res.status(201).json(assinatura);
  } catch (error) {
    console.error("Error creating assinatura pacote:", error);
    res.status(500).json({ message: "Failed to create assinatura pacote" });
  }
});

export default router;
