import { Router } from "express";
import { storage } from "../storage";
import { requireResponsavelAuth } from "../auth";
import { 
  updateAlunoContactSchema,
  guardianInscricaoEventoSchema,
  guardianCompraUniformeSchema
} from "@shared/schema";

const router = Router();

// Update aluno contact information
router.patch("/alunos/:alunoId/contact", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const alunoId = parseInt(req.params.alunoId);
    const validated = updateAlunoContactSchema.parse(req.body);
    const updated = await storage.updateAlunoContact(alunoId, responsavelId, validated);
    res.json(updated);
  } catch (error: any) {
    if (error.message === "Aluno not found or unauthorized") {
      return res.status(403).json({ message: "Não autorizado" });
    }
    console.error("Error updating aluno contact:", error);
    res.status(500).json({ message: "Erro ao atualizar dados do aluno" });
  }
});

// Get student's classes
router.get("/alunos/:alunoId/turmas", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const alunoId = parseInt(req.params.alunoId);
    const turmas = await storage.getTurmasByAluno(alunoId, responsavelId);
    res.json(turmas);
  } catch (error) {
    console.error("Error fetching turmas:", error);
    res.status(500).json({ message: "Erro ao buscar turmas" });
  }
});

// Get student's payment history
router.get("/alunos/:alunoId/pagamentos", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const alunoId = parseInt(req.params.alunoId);
    const pagamentos = await storage.getPagamentosByAlunoForGuardian(alunoId, responsavelId);
    res.json(pagamentos);
  } catch (error) {
    console.error("Error fetching pagamentos:", error);
    res.status(500).json({ message: "Erro ao buscar pagamentos" });
  }
});

// Get student's event enrollments
router.get("/alunos/:alunoId/inscricoes", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const alunoId = parseInt(req.params.alunoId);
    const aluno = await storage.getAlunoForGuardian(alunoId, responsavelId);
    if (!aluno) return res.status(403).json({ message: "Não autorizado" });
    const inscricoes = await storage.getInscricoesEventosByAluno(alunoId);
    res.json(inscricoes);
  } catch (error) {
    console.error("Error fetching inscricoes:", error);
    res.status(500).json({ message: "Erro ao buscar inscrições" });
  }
});

// Get available events for guardian's unit
router.get("/eventos", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const responsavel = await storage.getResponsavelWithAlunos(responsavelId);
    if (!responsavel || !responsavel.alunos || responsavel.alunos.length === 0) return res.json([]);
    const filialId = responsavel.alunos[0].filialId;
    if (!filialId) return res.json([]);
    const eventos = await storage.getEventosDisponiveisByFilial(filialId);
    res.json(eventos);
  } catch (error) {
    console.error("Error fetching eventos:", error);
    res.status(500).json({ message: "Erro ao buscar eventos" });
  }
});

// Enroll student in event
router.post("/eventos/:eventoId/inscricoes", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const eventoId = parseInt(req.params.eventoId);
    const validated = guardianInscricaoEventoSchema.parse(req.body);
    const inscricao = await storage.createGuardianInscricao(
      eventoId,
      validated.alunoId,
      responsavelId,
      validated.observacoes
    );
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Purchase uniform
router.post("/uniformes/:uniformeId/compras", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const uniformeId = parseInt(req.params.uniformeId);
    const validated = guardianCompraUniformeSchema.parse(req.body);
    const compra = await storage.createGuardianCompra(
      uniformeId,
      validated.alunoId,
      responsavelId,
      validated.tamanho,
      validated.cor,
      validated.quantidade
    );
    res.json(compra);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
