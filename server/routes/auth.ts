import { Router } from "express";
import { storage } from "../storage";
import { 
  adminLoginSchema,
  insertResponsavelSchema
} from "@shared/schema";
import { z } from "zod";
import { requireAdminAuth, requireGestorAuth, requireResponsavelAuth } from "../auth";

const router = Router();

// Traditional admin authentication routes
router.post('/admin/login', async (req, res) => {
  try {
    const { email, senha } = adminLoginSchema.parse(req.body);
    
    const user = await storage.authenticateAdminUser(email, senha);
    if (!user) {
      return res.status(401).json({ message: "Email ou senha inválidos" });
    }

    // Store admin user in session
    req.session.adminId = user.id;
    req.session.adminUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      papel: user.papel || 'admin'
    };

    res.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        papel: user.papel
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(400).json({ message: "Dados de login inválidos" });
  }
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao fazer logout" });
    }
    res.json({ success: true });
  });
});

router.get('/admin/user', (req, res) => {
  if (!req.session || !req.session.adminId || !req.session.adminUser) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  res.json(req.session.adminUser);
});

// Unit management authentication routes
router.post("/unidade/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const gestor = await storage.authenticateGestorUnidade(email, senha);
    
    if (!gestor) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const filial = await storage.getFilial(gestor.filialId);
    if (!filial) {
      return res.status(404).json({ message: "Filial não encontrada" });
    }

    req.session.gestorUnidadeId = gestor.id;
    req.session.filialId = gestor.filialId;

    await storage.updateGestorUltimoLogin(gestor.id);

    res.json({
      success: true,
      gestor: {
        id: gestor.id,
        nome: gestor.nome,
        email: gestor.email,
        filialId: gestor.filialId
      },
      filial: {
        id: filial.id,
        nome: filial.nome
      }
    });
  } catch (error) {
    console.error("Unit login error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.get("/unidade/me", requireGestorAuth, async (req, res) => {
  try {
    const gestorId = req.session.gestorUnidadeId!;
    const filialId = req.session.filialId!;
    
    const gestor = await storage.getGestorUnidade(gestorId);
    const filial = await storage.getFilial(filialId);
    
    if (!gestor || !filial) {
      return res.status(404).json({ message: "Dados não encontrados" });
    }

    res.json({
      gestor: {
        id: gestor.id,
        nome: gestor.nome,
        email: gestor.email,
        filialId: gestor.filialId
      },
      filial: {
        id: filial.id,
        nome: filial.nome
      }
    });
  } catch (error) {
    console.error("Error fetching unidade session:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.post("/unidade/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao fazer logout" });
    }
    res.json({ success: true });
  });
});

// Guardian authentication routes
const handleResponsavelLogin = async (req: any, res: any) => {
  try {
    const { email, senha } = req.body;
    const responsavel = await storage.authenticateResponsavel(email, senha);
    
    if (!responsavel) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    req.session.responsavelId = responsavel.id;

    req.session.save((err: any) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Erro ao salvar sessão" });
      }
      
      res.json({
        success: true,
        responsavel: {
          id: responsavel.id,
          nome: responsavel.nome,
          email: responsavel.email
        }
      });
    });
  } catch (error) {
    console.error("Guardian login error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

router.post("/responsaveis/cadastro", async (req, res) => {
  try {
    const validatedData = insertResponsavelSchema.parse(req.body);
    
    const existingResponsavel = await storage.getResponsavelByEmail(validatedData.email);
    if (existingResponsavel) {
      return res.status(400).json({ message: "Email já está em uso" });
    }

    const responsavel = await storage.createResponsavel(validatedData);
    res.status(201).json({ id: responsavel.id, nome: responsavel.nome, email: responsavel.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Error creating responsavel:", error);
    res.status(500).json({ message: "Erro ao criar conta" });
  }
});

router.post("/responsavel/login", handleResponsavelLogin);
router.post("/responsaveis/login", handleResponsavelLogin);

router.post("/responsavel/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao fazer logout" });
    }
    res.json({ success: true });
  });
});

router.get("/responsaveis/me", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const responsavel = await storage.getResponsavelWithAlunos(responsavelId);
    
    if (!responsavel) {
      return res.status(404).json({ message: "Responsável não encontrado" });
    }

    res.json(responsavel);
  } catch (error) {
    console.error("Error fetching responsavel data:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.patch("/responsaveis/me", requireResponsavelAuth, async (req, res) => {
  try {
    const responsavelId = req.session.responsavelId!;
    const { nome, email, telefone, senhaAtual, novaSenha } = req.body;
    
    // Se quiser trocar a senha, verificar a atual
    if (novaSenha) {
      if (!senhaAtual) {
        return res.status(400).json({ message: "Senha atual é obrigatória para trocar a senha" });
      }
      const isPasswordCorrect = await storage.verifyResponsavelPassword(responsavelId, senhaAtual);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }
    }

    const updatedData: any = { nome, email, telefone };
    if (novaSenha) {
      updatedData.senha = novaSenha;
    }

    const responsavel = await storage.updateResponsavel(responsavelId, updatedData);
    res.json(responsavel);
  } catch (error) {
    console.error("Error updating responsavel:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

export default router;
