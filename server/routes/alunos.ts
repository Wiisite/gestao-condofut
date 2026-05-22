import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth, requireGestorAuth } from "../auth";
import { insertAlunoSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Alunos routes
router.get("/", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    const isResponsavel = req.session.responsavelId;
    
    if (!isAdmin && !isGestor && !isResponsavel) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let alunosData;
    if (isAdmin) {
      const filialId = req.query.filialId ? parseInt(req.query.filialId as string) : undefined;
      if (filialId) {
        alunosData = await storage.getAlunosByFilial(filialId);
      } else {
        alunosData = await storage.getAlunos();
      }
    } else if (isGestor) {
      // Gestor vê apenas sua unidade
      alunosData = await storage.getAlunosByFilial(req.session.filialId!);
    } else {
      // Responsável vê apenas seus filhos
      const resp = await storage.getResponsavelWithAlunos(isResponsavel!);
      alunosData = resp?.alunos || [];
    }
    
    res.json(alunosData);
  } catch (error) {
    console.error("Error fetching alunos:", error);
    res.status(500).json({ message: "Failed to fetch alunos" });
  }
});

router.post("/", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    const isResponsavel = req.session.responsavelId;
    
    if (!isAdmin && !isGestor && !isResponsavel) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Sanitizar dados: remover strings vazias (Zod/Drizzle espera undefined, não '' ou null)
    const body = { ...req.body };
    const optionalStringFields = ['cpf', 'rg', 'email', 'telefone', 'dataNascimento', 'dataMatricula', 
      'fotoUrl', 'endereco', 'bairro', 'cep', 'cidade', 'estado', 'apartamento', 'bloco',
      'nomeResponsavel', 'telefoneResponsavel'];
    
    for (const field of optionalStringFields) {
      if (body[field] === '' || body[field] === null || body[field] === undefined) {
        delete body[field];
      }
    }
    
    // Converter filialId e responsavelId para número ou remover
    if (body.filialId === '' || body.filialId === null || body.filialId === undefined || body.filialId === 0) {
      delete body.filialId;
    } else {
      body.filialId = typeof body.filialId === 'string' ? parseInt(body.filialId) : body.filialId;
    }
    
    if (body.responsavelId === '' || body.responsavelId === null || body.responsavelId === undefined || body.responsavelId === 0) {
      delete body.responsavelId;
    } else {
      body.responsavelId = typeof body.responsavelId === 'string' ? parseInt(body.responsavelId) : body.responsavelId;
    }

    // Remover campo 'ativo' se for boolean (vem como true/false do form)
    if (typeof body.ativo === 'boolean') {
      // mantém
    } else if (body.ativo === '' || body.ativo === null || body.ativo === undefined) {
      delete body.ativo;
    }

    const validatedData = insertAlunoSchema.parse(body);
    
    // Se for gestor, forçar o filialId da sua unidade
    if (isGestor && !isAdmin) {
      validatedData.filialId = req.session.filialId!;
    }
    
    // Se for responsável, forçar o responsavelId dele mesmo
    if (isResponsavel && !isAdmin) {
      validatedData.responsavelId = isResponsavel;
    }
    
    const aluno = await storage.createAluno(validatedData);
    res.status(201).json(aluno);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation error creating aluno:", JSON.stringify(error.errors));
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Error creating aluno:", error.message || error);
    console.error("Body recebido:", JSON.stringify(req.body, null, 2));
    
    // Tratar erro de unique constraint (CPF duplicado)
    if (error.code === '23505' || (error.message && error.message.includes('unique'))) {
      return res.status(409).json({ message: "CPF já cadastrado para outro aluno" });
    }
    
    res.status(500).json({ message: error.message || "Failed to create aluno" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    const isResponsavel = req.session.responsavelId;
    
    if (!isAdmin && !isGestor && !isResponsavel) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    
    // Se for responsável, verificar se o aluno é dele
    if (isResponsavel && !isAdmin) {
      const alunoAtual = await storage.getAluno(id);
      if (!alunoAtual || alunoAtual.responsavelId !== isResponsavel) {
        return res.status(403).json({ message: "Não autorizado a alterar este aluno" });
      }
    }

    const aluno = await storage.updateAluno(id, req.body);
    res.json(aluno);
  } catch (error) {
    console.error("Error updating aluno:", error);
    res.status(500).json({ message: "Failed to update aluno" });
  }
});

// PATCH para compatibilidade com frontend
router.patch("/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    const isResponsavel = req.session.responsavelId;
    
    if (!isAdmin && !isGestor && !isResponsavel) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    
    // Se for responsável, verificar se o aluno é dele
    if (isResponsavel && !isAdmin) {
      const alunoAtual = await storage.getAluno(id);
      if (!alunoAtual || alunoAtual.responsavelId !== isResponsavel) {
        return res.status(403).json({ message: "Não autorizado a alterar este aluno" });
      }
    }

    const aluno = await storage.updateAluno(id, req.body);
    res.json(aluno);
  } catch (error) {
    console.error("Error updating aluno:", error);
    res.status(500).json({ message: "Failed to update aluno" });
  }
});

// Criar portal para aluno existente
router.post("/:id/portal", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    const responsavelData = req.body;
    
    // 1. Criar o responsável
    const responsavel = await storage.createResponsavel(responsavelData);
    
    // 2. Vincular ao aluno
    const aluno = await storage.updateAluno(id, { 
      responsavelId: responsavel.id,
      nomeResponsavel: responsavel.nome,
      telefoneResponsavel: responsavel.telefone
    });
    
    res.json(aluno);
  } catch (error) {
    console.error("Error creating portal for existing aluno:", error);
    res.status(500).json({ message: "Failed to create portal" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    const isResponsavel = req.session.responsavelId;
    
    if (!isAdmin && !isGestor && !isResponsavel) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = parseInt(req.params.id);
    
    if (isGestor && !isAdmin) {
      const alunoAtual = await storage.getAluno(id);
      if (!alunoAtual || alunoAtual.filialId !== req.session.filialId) {
        return res.status(403).json({ message: "Não autorizado a excluir este aluno" });
      }
    }

    if (isResponsavel && !isAdmin) {
      const alunoAtual = await storage.getAluno(id);
      if (!alunoAtual || alunoAtual.responsavelId !== isResponsavel) {
        return res.status(403).json({ message: "Não autorizado a excluir este aluno" });
      }
    }

    await storage.deleteAluno(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting aluno:", error);
    res.status(500).json({ message: "Failed to delete aluno" });
  }
});

// Matriculas
router.get("/:id/matriculas", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    const isResponsavel = req.session.responsavelId;
    
    if (!isAdmin && !isGestor && !isResponsavel) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const alunoId = parseInt(req.params.id);
    const todasMatriculas = await storage.getMatriculas();
    const matriculas = todasMatriculas.filter(m => m.alunoId === alunoId);
    res.json(matriculas);
  } catch (error) {
    console.error("Error fetching matriculas:", error);
    res.status(500).json({ message: "Failed to fetch matriculas" });
  }
});

// Rota unificada para cadastro de aluno e responsável (Admin/Gestor)
router.post("/completo", async (req, res) => {
  try {
    const isAdmin = req.session.adminId;
    const isGestor = req.session.gestorUnidadeId && req.session.filialId;
    
    if (!isAdmin && !isGestor) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { aluno, responsavel } = req.body;
    
    // Preparar dados para o storage.createAluno que já lida com a criação do responsável
    const fullAlunoData = {
      ...aluno,
      nomeResponsavel: responsavel.nome,
      telefoneResponsavel: responsavel.telefone,
      cpfResponsavel: responsavel.cpf,
      emailResponsavel: responsavel.email,
      senhaResponsavel: responsavel.senha,
    };

    if (isGestor && !isAdmin) {
      fullAlunoData.filialId = req.session.filialId!;
    }

    const newAluno = await storage.createAluno(fullAlunoData);
    res.status(201).json(newAluno);
  } catch (error) {
    console.error("Error creating full aluno:", error);
    res.status(500).json({ message: "Failed to create aluno and responsavel" });
  }
});

export default router;
