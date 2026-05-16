import { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import authRoutes from "./auth";
import filiaisRoutes from "./filiais";
import alunosRoutes from "./alunos";
import professoresRoutes from "./professores";
import turmasRoutes from "./turmas";
import financeiroRoutes from "./financeiro";
import mercadopagoRoutes from "./mercadopago";
import portalResponsavelRoutes from "./portal-responsavel";
import notificacoesRoutes from "./notificacoes";
import eventosUniformesRoutes from "./eventos-uniformes";
import atividadesRoutes from "./atividades";
import adminRoutes from "./admin";

// Extend session type for all authentication types
declare module "express-session" {
  interface SessionData {
    responsavelId?: number;
    gestorUnidadeId?: number;
    filialId?: number;
    adminId?: number;
    adminUser?: {
      id: number;
      nome: string;
      email: string;
      papel: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60, // 7 days
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'escola-futebol-secret-2024',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS em produção
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    },
  }));

  // Configurar prefixos para as rotas
  app.use("/api", authRoutes);
  app.use("/api/filiais", filiaisRoutes);
  app.use("/api/alunos", alunosRoutes);
  app.use("/api/professores", professoresRoutes);
  app.use("/api/turmas", turmasRoutes);
  app.use("/api/financeiro", financeiroRoutes);
  app.use("/api/mercadopago", mercadopagoRoutes);
  app.use("/api/portal", portalResponsavelRoutes);
  app.use("/api/notificacoes", notificacoesRoutes);
  app.use("/api", eventosUniformesRoutes); // Eventos e Uniformes usam /api/eventos e /api/uniformes
  app.use("/api", atividadesRoutes); // Presenças, Avaliações, Pacotes
  app.use("/api/admin", adminRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
