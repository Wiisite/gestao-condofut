import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth } from "../auth";

const router = Router();

// Pagamentos
router.get("/pagamentos", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let pagamentosData;
    if (isAdmin) {
      pagamentosData = await storage.getPagamentos();
    } else {
      // Filtrar pagamentos dos alunos da unidade do gestor
      const alunosDaUnidade = await storage.getAlunosByFilial(req.session.filialId!);
      const alunoIds = alunosDaUnidade.map(a => a.id);
      const todosPagamentos = await storage.getPagamentos();
      pagamentosData = todosPagamentos.filter(p => alunoIds.includes(p.alunoId || 0));
    }
    
    res.json(pagamentosData);
  } catch (error) {
    console.error("Error fetching pagamentos:", error);
    res.status(500).json({ message: "Failed to fetch pagamentos" });
  }
});

router.post("/pagamentos", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const pagamento = await storage.createPagamento(req.body);
    res.status(201).json(pagamento);
  } catch (error) {
    console.error("Error creating pagamento:", error);
    res.status(500).json({ message: "Failed to create pagamento" });
  }
});

router.put("/pagamentos/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    const pagamento = await storage.updatePagamento(id, req.body);
    res.json(pagamento);
  } catch (error) {
    console.error("Error updating pagamento:", error);
    res.status(500).json({ message: "Failed to update pagamento" });
  }
});

router.get("/pagamentos/aluno/:alunoId", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const alunoId = parseInt(req.params.alunoId);
    const pagamentos = await storage.getPagamentosByAluno(alunoId);
    res.json(pagamentos);
  } catch (error) {
    console.error("Error fetching pagamentos by aluno:", error);
    res.status(500).json({ message: "Failed to fetch pagamentos" });
  }
});

// Planos Financeiros
router.get("/planos-financeiros", async (req, res) => {
  try {
    const planos = await storage.getPlanosFinanceiros();
    res.json(planos);
  } catch (error) {
    console.error("Error fetching planos financeiros:", error);
    res.status(500).json({ message: "Failed to fetch planos financeiros" });
  }
});

router.post("/planos-financeiros", requireAdminAuth, async (req, res) => {
  try {
    const plano = await storage.createPlanoFinanceiro(req.body);
    res.status(201).json(plano);
  } catch (error) {
    console.error("Error creating plano financeiro:", error);
    res.status(500).json({ message: "Failed to create plano financeiro" });
  }
});

// Combos de Aulas
router.get("/combos-aulas", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const combos = await storage.getCombosAulas();
    res.json(combos);
  } catch (error) {
    console.error("Error fetching combos aulas:", error);
    res.status(500).json({ message: "Failed to fetch combos aulas" });
  }
});

router.post("/combos-aulas", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const combo = await storage.createComboAulas(req.body);
    res.status(201).json(combo);
  } catch (error) {
    console.error("Error creating combo aulas:", error);
    res.status(500).json({ message: "Failed to create combo aulas" });
  }
});

router.put("/combos-aulas/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    const combo = await storage.updateComboAulas(id, req.body);
    res.json(combo);
  } catch (error) {
    console.error("Error updating combo aulas:", error);
    res.status(500).json({ message: "Failed to update combo aulas" });
  }
});

router.delete("/combos-aulas/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    await storage.deleteComboAulas(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting combo aulas:", error);
    res.status(500).json({ message: "Failed to delete combo aulas" });
  }
});

export default router;
