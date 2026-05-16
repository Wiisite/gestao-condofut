import {
  users,
  alunos,
  professores,
  turmas,
  matriculas,
  pagamentos,
  filiais,
  responsaveis,
  eventos,
  uniformes,
  notificacoes,
  inscricoesEventos,
  comprasUniformes,
  presencas,
  pacotesTreino,
  assinaturasPacotes,
  categoriasTestes,
  testes,
  avaliacoesFisicas,
  resultadosTestes,
  metasAlunos,
  gestoresUnidade,
  combosAulas,
  configuracoesSistema,
  planosFinanceiros,
  type User,
  type UpsertUser,
  adminUsers,
  type AdminUser,
  type InsertAdminUser,
  type ConfiguracoesSistema,
  type InsertConfiguracoesSistema,
  type GestorUnidade,
  type InsertGestorUnidade,
  type GestorUnidadeWithFilial,
  type Aluno,
  type InsertAluno,
  type Professor,
  type InsertProfessor,
  type Turma,
  type InsertTurma,
  type TurmaWithProfessor,
  type Matricula,
  type InsertMatricula,
  type Pagamento,
  type InsertPagamento,
  type AlunoWithTurmas,
  type AlunoWithFilial,
  type Filial,
  type InsertFilial,
  type PlanoFinanceiro,
  type InsertPlanoFinanceiro,
  type PlanoFinanceiroWithFilial,
  type Responsavel,
  type InsertResponsavel,
  type ResponsavelWithAlunos,
  type Evento,
  type InsertEvento,
  type EventoWithFilial,
  type Uniforme,
  type InsertUniforme,
  type Notificacao,
  type InsertNotificacao,
  type InscricaoEvento,
  type InsertInscricaoEvento,
  type CompraUniforme,
  type InsertCompraUniforme,
  type Presenca,
  type InsertPresenca,
  type PacoteTreino,
  type InsertPacoteTreino,
  type AssinaturaPacote,
  type InsertAssinaturaPacote,
  type AssinaturaPacoteComplete,
  type CategoriaTeste,
  type InsertCategoriaTeste,
  type Teste,
  type InsertTeste,
  type TesteWithCategoria,
  type AvaliacaoFisica,
  type InsertAvaliacaoFisica,
  type AvaliacaoFisicaComplete,
  type ResultadoTeste,
  type InsertResultadoTeste,
  type MetaAluno,
  type InsertMetaAluno,
  type MetaAlunoComplete,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Admin user operations for traditional authentication
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  authenticateAdminUser(email: string, senha: string): Promise<AdminUser | null>;
  updateAdminUserLastLogin(id: number): Promise<void>;

  // Alunos operations
  getAlunos(): Promise<AlunoWithFilial[]>;
  getAluno(id: number): Promise<AlunoWithTurmas | undefined>;
  createAluno(aluno: InsertAluno & { cpfResponsavel?: string; emailResponsavel?: string; senhaResponsavel?: string }): Promise<Aluno>;
  updateAluno(id: number, aluno: Partial<InsertAluno>): Promise<Aluno>;
  deleteAluno(id: number): Promise<void>;

  // Professores operations
  getProfessores(): Promise<(Professor & { filial: Filial | null })[]>;
  getProfessor(id: number): Promise<Professor | undefined>;
  createProfessor(professor: InsertProfessor): Promise<Professor>;
  updateProfessor(id: number, professor: Partial<InsertProfessor>): Promise<Professor>;
  deleteProfessor(id: number): Promise<void>;

  // Turmas operations
  getTurmas(): Promise<TurmaWithProfessor[]>;
  getTurma(id: number): Promise<TurmaWithProfessor | undefined>;
  createTurma(turma: InsertTurma): Promise<Turma>;
  updateTurma(id: number, turma: Partial<InsertTurma>): Promise<Turma>;
  deleteTurma(id: number): Promise<void>;

  // Matriculas operations
  getMatriculas(): Promise<Matricula[]>;
  createMatricula(matricula: InsertMatricula): Promise<Matricula>;
  deleteMatricula(id: number): Promise<void>;

  // Pagamentos operations
  getPagamentos(): Promise<Pagamento[]>;
  getPagamento(id: number): Promise<Pagamento | undefined>;
  getPagamentosByAluno(alunoId: number): Promise<Pagamento[]>;
  createPagamento(pagamento: InsertPagamento): Promise<Pagamento>;
  updatePagamento(id: number, pagamento: Partial<InsertPagamento>): Promise<Pagamento>;
  deletePagamento(id: number): Promise<void>;

  // Planos Financeiros operations
  getPlanosFinanceiros(): Promise<PlanoFinanceiroWithFilial[]>;
  getPlanoFinanceiro(id: number): Promise<PlanoFinanceiro | undefined>;
  createPlanoFinanceiro(plano: InsertPlanoFinanceiro): Promise<PlanoFinanceiro>;
  updatePlanoFinanceiro(id: number, plano: Partial<InsertPlanoFinanceiro>): Promise<PlanoFinanceiro>;
  deletePlanoFinanceiro(id: number): Promise<void>;

  // Filiais operations
  getFiliais(): Promise<Filial[]>;
  getFiliaisDetalhadas(): Promise<any[]>;
  getFilial(id: number): Promise<Filial | undefined>;
  createFilial(filial: InsertFilial): Promise<Filial>;
  updateFilial(id: number, filial: Partial<InsertFilial>): Promise<Filial>;
  deleteFilial(id: number): Promise<void>;
  getAlunosByFilial(filialId: number): Promise<AlunoWithFilial[]>;
  getProfessoresByFilial(filialId: number): Promise<Professor[]>;
  getTurmasByFilial(filialId: number): Promise<TurmaWithProfessor[]>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalAlunos: number;
    totalProfessores: number;
    totalTurmas: number;
    receitaMensal: number;
  }>;

  // Responsáveis operations
  getResponsavel(id: number): Promise<Responsavel | undefined>;
  getResponsavelByEmail(email: string): Promise<Responsavel | undefined>;
  createResponsavel(responsavel: InsertResponsavel): Promise<Responsavel>;
  authenticateResponsavel(email: string, senha: string): Promise<Responsavel | null>;
  getResponsavelWithAlunos(id: number): Promise<ResponsavelWithAlunos | undefined>;

  // Gestores de Unidade operations
  getGestorUnidade(id: number): Promise<GestorUnidade | undefined>;
  getGestorUnidadeByEmail(email: string): Promise<GestorUnidade | undefined>;
  createGestorUnidade(gestor: InsertGestorUnidade): Promise<GestorUnidade>;
  authenticateGestorUnidade(email: string, senha: string): Promise<GestorUnidadeWithFilial | null>;
  updateGestorUltimoLogin(id: number): Promise<void>;

  // Eventos operations
  getEventos(): Promise<EventoWithFilial[]>;
  createEvento(evento: InsertEvento): Promise<Evento>;
  inscreveAlunoEvento(inscricao: InsertInscricaoEvento): Promise<InscricaoEvento>;

  // Uniformes operations
  getUniformes(): Promise<Uniforme[]>;
  comprarUniforme(compra: InsertCompraUniforme): Promise<CompraUniforme>;

  // Notificações operations
  getNotificacoesByResponsavel(responsavelId: number): Promise<Notificacao[]>;
  createNotificacao(notificacao: InsertNotificacao): Promise<Notificacao>;
  marcarNotificacaoLida(id: number): Promise<void>;

  // Presenças operations
  getPresencas(): Promise<Presenca[]>;
  getPresencasByTurmaData(turmaId: number, data: string): Promise<Presenca[]>;
  getPresencasDetalhadas(): Promise<any[]>;
  registrarPresencas(presencas: InsertPresenca[]): Promise<Presenca[]>;
  createPresenca(presenca: InsertPresenca): Promise<Presenca>;

  // Uniformes operations
  getUniformes(): Promise<Uniforme[]>;
  createUniforme(uniforme: InsertUniforme): Promise<Uniforme>;
  getComprasUniformes(): Promise<any[]>;
  comprarUniforme(compra: InsertCompraUniforme): Promise<CompraUniforme>;

  // Eventos operations
  getEventos(): Promise<EventoWithFilial[]>;
  createEvento(evento: InsertEvento): Promise<Evento>;
  getInscricoesEventos(): Promise<InscricaoEvento[]>;
  inscreveAlunoEvento(inscricao: InsertInscricaoEvento): Promise<InscricaoEvento>;

  // Pacotes de treino operations
  getPacotesTreino(): Promise<PacoteTreino[]>;
  createPacoteTreino(pacote: InsertPacoteTreino): Promise<PacoteTreino>;
  getAssinaturasPacotes(): Promise<AssinaturaPacoteComplete[]>;
  criarAssinaturaPacote(assinatura: InsertAssinaturaPacote): Promise<AssinaturaPacote>;

  // Physical evaluation operations
  getCategoriasTestes(): Promise<CategoriaTeste[]>;
  createCategoriaTeste(categoria: InsertCategoriaTeste): Promise<CategoriaTeste>;
  updateCategoriaTeste(id: number, categoria: Partial<InsertCategoriaTeste>): Promise<CategoriaTeste>;
  deleteCategoriaTeste(id: number): Promise<void>;

  getTestes(): Promise<TesteWithCategoria[]>;
  getTestesByCategoria(categoriaId: number): Promise<TesteWithCategoria[]>;
  createTeste(teste: InsertTeste): Promise<Teste>;
  updateTeste(id: number, teste: Partial<InsertTeste>): Promise<Teste>;
  deleteTeste(id: number): Promise<void>;

  getAvaliacoesFisicas(): Promise<AvaliacaoFisicaComplete[]>;
  getAvaliacoesByAluno(alunoId: number): Promise<AvaliacaoFisicaComplete[]>;
  getAvaliacoesByFilial(filialId: number): Promise<AvaliacaoFisicaComplete[]>;
  createAvaliacaoFisica(avaliacao: InsertAvaliacaoFisica): Promise<AvaliacaoFisica>;
  updateAvaliacaoFisica(id: number, avaliacao: Partial<InsertAvaliacaoFisica>): Promise<AvaliacaoFisica>;
  deleteAvaliacaoFisica(id: number): Promise<void>;

  getResultadosTestes(): Promise<ResultadoTeste[]>;
  getResultadosByAvaliacao(avaliacaoId: number): Promise<ResultadoTeste[]>;
  createResultadoTeste(resultado: InsertResultadoTeste): Promise<ResultadoTeste>;
  updateResultadoTeste(id: number, resultado: Partial<InsertResultadoTeste>): Promise<ResultadoTeste>;
  deleteResultadoTeste(id: number): Promise<void>;

  getMetasAlunos(): Promise<MetaAlunoComplete[]>;
  getMetasByAluno(alunoId: number): Promise<MetaAlunoComplete[]>;
  createMetaAluno(meta: InsertMetaAluno): Promise<MetaAluno>;
  updateMetaAluno(id: number, meta: Partial<InsertMetaAluno>): Promise<MetaAluno>;
  deleteMetaAluno(id: number): Promise<void>;

  // Combos de Aulas operations
  getCombosAulas(): Promise<any[]>;
  createComboAulas(combo: any): Promise<any>;
  updateComboAulas(id: number, combo: any): Promise<any>;
  deleteComboAulas(id: number): Promise<void>;

  // Guardian portal operations
  getAlunoForGuardian(alunoId: number, responsavelId: number): Promise<AlunoWithTurmas | undefined>;
  updateAlunoContact(alunoId: number, responsavelId: number, data: any): Promise<Aluno>;
  getTurmasByAluno(alunoId: number, responsavelId: number): Promise<TurmaWithProfessor[]>;
  getEventosDisponiveisByFilial(filialId: number): Promise<EventoWithFilial[]>;
  createGuardianInscricao(eventoId: number, alunoId: number, responsavelId: number, observacoes?: string): Promise<InscricaoEvento>;
  createGuardianCompra(uniformeId: number, alunoId: number, responsavelId: number, tamanho: string, cor: string, quantidade: number): Promise<CompraUniforme>;
  getPagamentosByAlunoForGuardian(alunoId: number, responsavelId: number): Promise<Pagamento[]>;
  getInscricoesEventosByAluno(alunoId: number): Promise<InscricaoEvento[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Admin user operations for traditional authentication
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user || undefined;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user || undefined;
  }

  async createAdminUser(userData: InsertAdminUser): Promise<AdminUser> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.senha, 10);
    
    const [user] = await db
      .insert(adminUsers)
      .values({
        ...userData,
        senha: hashedPassword,
      })
      .returning();
    return user;
  }

  async authenticateAdminUser(email: string, senha: string): Promise<AdminUser | null> {
    const user = await this.getAdminUserByEmail(email);
    if (!user || !user.ativo) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(senha, user.senha);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await this.updateAdminUserLastLogin(user.id);
    return user;
  }

  async updateAdminUserLastLogin(id: number): Promise<void> {
    await db
      .update(adminUsers)
      .set({
        ultimoLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, id));
  }

  // Alunos operations
  async getAlunos(): Promise<AlunoWithFilial[]> {
    const alunosData = await db
      .select({
        id: alunos.id,
        nome: alunos.nome,
        cpf: alunos.cpf,
        rg: alunos.rg,
        email: alunos.email,
        telefone: alunos.telefone,
        dataNascimento: alunos.dataNascimento,
        dataMatricula: alunos.dataMatricula,
        fotoUrl: alunos.fotoUrl,
        endereco: alunos.endereco,
        bairro: alunos.bairro,
        cep: alunos.cep,
        cidade: alunos.cidade,
        estado: alunos.estado,
        responsavelId: alunos.responsavelId,
        nomeResponsavel: alunos.nomeResponsavel,
        telefoneResponsavel: alunos.telefoneResponsavel,
        filialId: alunos.filialId,
        ativo: alunos.ativo,
        createdAt: alunos.createdAt,
        updatedAt: alunos.updatedAt,
        filial: filiais,
      })
      .from(alunos)
      .leftJoin(filiais, eq(alunos.filialId, filiais.id))
      .orderBy(desc(alunos.createdAt));

    // Calcular status de pagamento para cada aluno
    const alunosComStatus = await Promise.all(
      alunosData.map(async (aluno) => {
        const statusPagamento = await this.calcularStatusPagamento(aluno.id);
        return {
          ...aluno,
          statusPagamento,
        };
      })
    );

    return alunosComStatus;
  }

  async calcularStatusPagamento(alunoId: number) {
    // Buscar o último pagamento do aluno
    const ultimoPagamento = await db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.alunoId, alunoId))
      .orderBy(desc(pagamentos.mesReferencia))
      .limit(1);

    if (ultimoPagamento.length === 0) {
      // Aluno nunca fez pagamento
      return {
        emDia: false,
        ultimoPagamento: undefined,
        diasAtraso: undefined,
      };
    }

    const ultimoMesReferencia = ultimoPagamento[0].mesReferencia;
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    
    // Verificar se o último pagamento é do mês atual
    const emDia = ultimoMesReferencia === mesAtual;
    
    // Calcular dias de atraso se não estiver em dia
    let diasAtraso = 0;
    try {
      if (!emDia) {
        const [anoUltimo, mesUltimo] = ultimoMesReferencia.split('-').map(Number);
        if (!isNaN(anoUltimo) && !isNaN(mesUltimo)) {
          const proximoMesDevido = new Date(anoUltimo, mesUltimo, 1);
          const diffTempo = agora.getTime() - proximoMesDevido.getTime();
          diasAtraso = Math.floor(diffTempo / (1000 * 60 * 60 * 24));
        }
      }
    } catch (err) {
      console.error("Erro ao calcular dias de atraso:", err);
    }

    return {
      emDia,
      ultimoPagamento: ultimoMesReferencia,
      diasAtraso: !emDia ? diasAtraso : undefined,
    };
  }

  async getAluno(id: number): Promise<AlunoWithTurmas | undefined> {
    const [aluno] = await db
      .select()
      .from(alunos)
      .where(and(eq(alunos.id, id), eq(alunos.ativo, true)));

    if (!aluno) return undefined;

    const matriculasData = await db
      .select({
        matricula: matriculas,
        turma: turmas,
        professor: professores,
      })
      .from(matriculas)
      .leftJoin(turmas, eq(matriculas.turmaId, turmas.id))
      .leftJoin(professores, eq(turmas.professorId, professores.id))
      .where(and(eq(matriculas.alunoId, id), eq(matriculas.ativo, true)));

    return {
      ...aluno,
      matriculas: matriculasData.map((item) => ({
        ...item.matricula,
        turma: {
          ...item.turma!,
          professor: item.professor,
        },
      })),
    };
  }

  async createAluno(aluno: InsertAluno & { cpfResponsavel?: string; emailResponsavel?: string; senhaResponsavel?: string }): Promise<Aluno> {
    const { cpfResponsavel, emailResponsavel, senhaResponsavel, ...alunoData } = aluno;
    
    // Create responsável if portal access data is provided
    let responsavelId: number | undefined;
    if (cpfResponsavel && emailResponsavel && senhaResponsavel) {
      const hashedPassword = await bcrypt.hash(senhaResponsavel, 10);
      
      const [newResponsavel] = await db.insert(responsaveis).values({
        nome: alunoData.nomeResponsavel || "Responsável",
        email: emailResponsavel,
        senha: hashedPassword,
        telefone: alunoData.telefoneResponsavel,
        cpf: cpfResponsavel,
        endereco: alunoData.endereco,
        bairro: alunoData.bairro,
        cep: alunoData.cep,
        cidade: alunoData.cidade,
        estado: alunoData.estado,
        ativo: true,
      }).returning();
      
      responsavelId = newResponsavel.id;
    }
    
    const [newAluno] = await db.insert(alunos).values({
      ...alunoData,
      responsavelId: responsavelId || alunoData.responsavelId,
    }).returning();
    
    return newAluno;
  }

  async updateAluno(id: number, aluno: Partial<InsertAluno>): Promise<Aluno> {
    const [updatedAluno] = await db
      .update(alunos)
      .set({ ...aluno, updatedAt: new Date() })
      .where(eq(alunos.id, id))
      .returning();
    return updatedAluno;
  }

  async deleteAluno(id: number): Promise<void> {
    // First delete all related records that reference the student
    await db.delete(assinaturasPacotes).where(eq(assinaturasPacotes.alunoId, id));
    await db.delete(matriculas).where(eq(matriculas.alunoId, id));
    await db.delete(pagamentos).where(eq(pagamentos.alunoId, id));
    await db.delete(presencas).where(eq(presencas.alunoId, id));
    // Note: resultadosTestes table doesn't have alunoId directly, it's linked through avaliacaoId
    await db.delete(metasAlunos).where(eq(metasAlunos.alunoId, id));
    await db.delete(avaliacoesFisicas).where(eq(avaliacoesFisicas.alunoId, id));
    await db.delete(inscricoesEventos).where(eq(inscricoesEventos.alunoId, id));
    await db.delete(comprasUniformes).where(eq(comprasUniformes.alunoId, id));
    
    // Then delete the student record
    await db.delete(alunos).where(eq(alunos.id, id));
  }

  // Professores operations
  async getProfessores(): Promise<(Professor & { filial: Filial | null })[]> {
    return await db
      .select()
      .from(professores)
      .leftJoin(filiais, eq(professores.filialId, filiais.id))
      .where(eq(professores.ativo, true))
      .orderBy(desc(professores.createdAt))
      .then(results => results.map(result => ({
        ...result.professores,
        filial: result.filiais,
      })));
  }

  async getProfessor(id: number): Promise<Professor | undefined> {
    const [professor] = await db
      .select()
      .from(professores)
      .where(and(eq(professores.id, id), eq(professores.ativo, true)));
    return professor;
  }

  async createProfessor(professor: InsertProfessor): Promise<Professor> {
    const [newProfessor] = await db.insert(professores).values(professor).returning();
    return newProfessor;
  }

  async updateProfessor(id: number, professor: Partial<InsertProfessor>): Promise<Professor> {
    const [updatedProfessor] = await db
      .update(professores)
      .set({ ...professor, updatedAt: new Date() })
      .where(eq(professores.id, id))
      .returning();
    return updatedProfessor;
  }

  async deleteProfessor(id: number): Promise<void> {
    await db.update(professores).set({ ativo: false }).where(eq(professores.id, id));
  }

  // Turmas operations
  async getTurmas(): Promise<TurmaWithProfessor[]> {
    const turmasData = await db
      .select({
        turma: turmas,
        professor: professores,
        filial: filiais,
        matriculasCount: count(matriculas.id),
      })
      .from(turmas)
      .leftJoin(professores, eq(turmas.professorId, professores.id))
      .leftJoin(filiais, eq(turmas.filialId, filiais.id))
      .leftJoin(matriculas, and(eq(matriculas.turmaId, turmas.id), eq(matriculas.ativo, true)))
      .where(eq(turmas.ativo, true))
      .groupBy(turmas.id, professores.id, filiais.id)
      .orderBy(desc(turmas.createdAt));

    return turmasData.map((item) => ({
      ...item.turma,
      professor: item.professor,
      filial: item.filial,
      _count: {
        matriculas: item.matriculasCount,
      },
    }));
  }

  async getTurma(id: number): Promise<TurmaWithProfessor | undefined> {
    const [turmaData] = await db
      .select({
        turma: turmas,
        professor: professores,
        filial: filiais,
      })
      .from(turmas)
      .leftJoin(professores, eq(turmas.professorId, professores.id))
      .leftJoin(filiais, eq(turmas.filialId, filiais.id))
      .where(and(eq(turmas.id, id), eq(turmas.ativo, true)));

    if (!turmaData) return undefined;

    return {
      ...turmaData.turma,
      professor: turmaData.professor,
      filial: turmaData.filial,
    };
  }

  async createTurma(turma: InsertTurma): Promise<Turma> {
    const [newTurma] = await db.insert(turmas).values(turma).returning();
    return newTurma;
  }

  async updateTurma(id: number, turma: Partial<InsertTurma>): Promise<Turma> {
    const [updatedTurma] = await db
      .update(turmas)
      .set({ ...turma, updatedAt: new Date() })
      .where(eq(turmas.id, id))
      .returning();
    return updatedTurma;
  }

  async deleteTurma(id: number): Promise<void> {
    await db.update(turmas).set({ ativo: false }).where(eq(turmas.id, id));
  }

  // Matriculas operations
  async getMatriculas(): Promise<Matricula[]> {
    return await db.select().from(matriculas).where(eq(matriculas.ativo, true)).orderBy(desc(matriculas.createdAt));
  }

  async createMatricula(matricula: InsertMatricula): Promise<Matricula> {
    const [newMatricula] = await db.insert(matriculas).values(matricula).returning();
    return newMatricula;
  }

  async deleteMatricula(id: number): Promise<void> {
    await db.update(matriculas).set({ ativo: false }).where(eq(matriculas.id, id));
  }

  // Pagamentos operations
  async getPagamentos(): Promise<Pagamento[]> {
    return await db.select().from(pagamentos).orderBy(desc(pagamentos.createdAt));
  }

  async getPagamento(id: number): Promise<Pagamento | undefined> {
    const [pagamento] = await db.select().from(pagamentos).where(eq(pagamentos.id, id));
    return pagamento;
  }

  async getPagamentosByAluno(alunoId: number): Promise<Pagamento[]> {
    return await db.select().from(pagamentos).where(eq(pagamentos.alunoId, alunoId)).orderBy(desc(pagamentos.createdAt));
  }

  async createPagamento(pagamento: InsertPagamento): Promise<Pagamento> {
    const [newPagamento] = await db.insert(pagamentos).values(pagamento).returning();
    return newPagamento;
  }

  async updatePagamento(id: number, pagamentoData: Partial<InsertPagamento>): Promise<Pagamento> {
    const [pagamento] = await db
      .update(pagamentos)
      .set({ ...pagamentoData, updatedAt: new Date() })
      .where(eq(pagamentos.id, id))
      .returning();
    return pagamento;
  }

  async deletePagamento(id: number): Promise<void> {
    await db.delete(pagamentos).where(eq(pagamentos.id, id));
  }

  // Planos Financeiros operations
  async getPlanosFinanceiros(): Promise<PlanoFinanceiroWithFilial[]> {
    const planos = await db.select().from(planosFinanceiros).where(eq(planosFinanceiros.ativo, true)).orderBy(desc(planosFinanceiros.createdAt));
    
    const planosWithFilial = await Promise.all(
      planos.map(async (plano) => {
        let filial = null;
        if (plano.filialId) {
          const [f] = await db.select().from(filiais).where(eq(filiais.id, plano.filialId));
          filial = f || null;
        }
        return { ...plano, filial };
      })
    );
    
    return planosWithFilial;
  }

  async getPlanoFinanceiro(id: number): Promise<PlanoFinanceiro | undefined> {
    const [plano] = await db.select().from(planosFinanceiros).where(eq(planosFinanceiros.id, id));
    return plano;
  }

  async createPlanoFinanceiro(plano: InsertPlanoFinanceiro): Promise<PlanoFinanceiro> {
    const [newPlano] = await db.insert(planosFinanceiros).values(plano).returning();
    return newPlano;
  }

  async updatePlanoFinanceiro(id: number, planoData: Partial<InsertPlanoFinanceiro>): Promise<PlanoFinanceiro> {
    const [plano] = await db
      .update(planosFinanceiros)
      .set({ ...planoData, updatedAt: new Date() })
      .where(eq(planosFinanceiros.id, id))
      .returning();
    return plano;
  }

  async deletePlanoFinanceiro(id: number): Promise<void> {
    await db.update(planosFinanceiros).set({ ativo: false }).where(eq(planosFinanceiros.id, id));
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalAlunos: number;
    totalProfessores: number;
    totalTurmas: number;
    receitaMensal: number;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const [alunosCount] = await db
      .select({ count: count() })
      .from(alunos);

    const [professoresCount] = await db
      .select({ count: count() })
      .from(professores)
      .where(eq(professores.ativo, true));

    const [turmasCount] = await db
      .select({ count: count() })
      .from(turmas)
      .where(eq(turmas.ativo, true));

    const [receitaResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${pagamentos.valor}), 0)`,
      })
      .from(pagamentos)
      .where(eq(pagamentos.mesReferencia, currentMonth));

    return {
      totalAlunos: alunosCount.count,
      totalProfessores: professoresCount.count,
      totalTurmas: turmasCount.count,
      receitaMensal: Number(receitaResult.total),
    };
  }

  // Filiais operations
  async getFiliais(): Promise<Filial[]> {
    return await db.select().from(filiais).where(sql`${filiais.ativa} IS NOT FALSE`).orderBy(desc(filiais.createdAt));
  }

  async getFilial(id: number): Promise<Filial | undefined> {
    const [filial] = await db.select().from(filiais).where(eq(filiais.id, id));
    return filial;
  }

  async createFilial(filial: InsertFilial): Promise<Filial> {
    const [newFilial] = await db.insert(filiais).values(filial).returning();
    return newFilial;
  }

  async updateFilial(id: number, filial: Partial<InsertFilial>): Promise<Filial> {
    const [updatedFilial] = await db
      .update(filiais)
      .set({ ...filial, updatedAt: new Date() })
      .where(eq(filiais.id, id))
      .returning();
    return updatedFilial;
  }

  async deleteFilial(id: number): Promise<void> {
    await db.update(filiais).set({ ativa: false }).where(eq(filiais.id, id));
  }

  async getFiliaisDetalhadas(): Promise<any[]> {
    const filiaisData = await db.select().from(filiais).where(sql`${filiais.ativa} IS NOT FALSE`);
    
    const filiaisComDetalhes = await Promise.all(
      filiaisData.map(async (filial) => {
        // Contar alunos por filial
        const totalAlunosResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(alunos)
          .where(eq(alunos.filialId, filial.id));
        
        // Contar professores por filial
        const totalProfessoresResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(professores)
          .where(eq(professores.filialId, filial.id));
        
        // Contar turmas por filial
        const totalTurmasResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(turmas)
          .where(eq(turmas.filialId, filial.id));
        
        // Calcular receita mensal (soma dos pagamentos do mês atual)
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        let receitaMensal = 0;
        try {
          const receitaResult = await db
            .select({ total: sql<number>`coalesce(sum(cast(valor as decimal)), 0)` })
            .from(pagamentos)
            .innerJoin(alunos, eq(pagamentos.alunoId, alunos.id))
            .where(and(
              eq(alunos.filialId, filial.id),
              sql`extract(month from cast(${pagamentos.dataPagamento} as date)) = ${currentMonth}`,
              sql`extract(year from cast(${pagamentos.dataPagamento} as date)) = ${currentYear}`
            ));
          receitaMensal = Number(receitaResult[0]?.total || 0);
        } catch (err) {
          console.error(`Erro ao calcular receita da filial ${filial.id}:`, err);
        }

        return {
          ...filial,
          totalAlunos: totalAlunosResult[0]?.count || 0,
          totalProfessores: totalProfessoresResult[0]?.count || 0,
          totalTurmas: totalTurmasResult[0]?.count || 0,
          receitaMensal: receitaMensal,
        };
      })
    );

    return filiaisComDetalhes;
  }

  async getAlunosByFilial(filialId: number): Promise<AlunoWithFilial[]> {
    const alunosData = await db
      .select({
        aluno: alunos,
        filial: filiais,
      })
      .from(alunos)
      .leftJoin(filiais, eq(alunos.filialId, filiais.id))
      .where(eq(alunos.filialId, filialId));

    return alunosData.map(({ aluno, filial }) => ({
      ...aluno,
      filial,
    }));
  }

  async getProfessoresByFilial(filialId: number): Promise<Professor[]> {
    return await db
      .select()
      .from(professores)
      .where(eq(professores.filialId, filialId));
  }

  async getTurmasByFilial(filialId: number): Promise<TurmaWithProfessor[]> {
    const turmasData = await db
      .select({
        turma: turmas,
        professor: professores,
        filial: filiais,
      })
      .from(turmas)
      .leftJoin(professores, eq(turmas.professorId, professores.id))
      .leftJoin(filiais, eq(turmas.filialId, filiais.id))
      .where(eq(turmas.filialId, filialId));

    return turmasData.map(({ turma, professor, filial }) => ({
      ...turma,
      professor,
      filial,
    }));
  }

  // Responsáveis operations
  async getResponsavel(id: number): Promise<Responsavel | undefined> {
    const [responsavel] = await db.select().from(responsaveis).where(eq(responsaveis.id, id));
    return responsavel;
  }

  async getResponsavelByEmail(email: string): Promise<Responsavel | undefined> {
    const [responsavel] = await db.select().from(responsaveis).where(eq(responsaveis.email, email));
    return responsavel;
  }

  async createResponsavel(responsavelData: InsertResponsavel): Promise<Responsavel> {
    const hashedPassword = await bcrypt.hash(responsavelData.senha, 10);
    const [novoResponsavel] = await db
      .insert(responsaveis)
      .values({
        ...responsavelData,
        senha: hashedPassword,
      })
      .returning();
    return novoResponsavel;
  }

  async authenticateResponsavel(email: string, senha: string): Promise<Responsavel | null> {
    const [responsavel] = await db
      .select()
      .from(responsaveis)
      .where(eq(responsaveis.email, email));
    
    if (!responsavel) return null;
    
    // Comparar senha usando bcrypt
    const senhaValida = await bcrypt.compare(senha, responsavel.senha);
    if (!senhaValida) return null;
    
    return responsavel;
  }

  async getResponsavelWithAlunos(id: number): Promise<ResponsavelWithAlunos | undefined> {
    const responsavel = await this.getResponsavel(id);
    if (!responsavel) return undefined;

    const alunosDoResponsavel = await db
      .select({
        id: alunos.id,
        nome: alunos.nome,
        cpf: alunos.cpf,
        rg: alunos.rg,
        email: alunos.email,
        telefone: alunos.telefone,
        dataNascimento: alunos.dataNascimento,
        dataMatricula: alunos.dataMatricula,
        fotoUrl: alunos.fotoUrl,
        endereco: alunos.endereco,
        bairro: alunos.bairro,
        cep: alunos.cep,
        cidade: alunos.cidade,
        estado: alunos.estado,
        responsavelId: alunos.responsavelId,
        nomeResponsavel: alunos.nomeResponsavel,
        telefoneResponsavel: alunos.telefoneResponsavel,
        filialId: alunos.filialId,
        ativo: alunos.ativo,
        createdAt: alunos.createdAt,
        updatedAt: alunos.updatedAt,
        filial: filiais,
      })
      .from(alunos)
      .leftJoin(filiais, eq(alunos.filialId, filiais.id))
      .where(eq(alunos.responsavelId, id));

    // Calcular status de pagamento para cada aluno
    const alunosComStatus = await Promise.all(
      alunosDoResponsavel.map(async (aluno) => {
        const statusPagamento = await this.calcularStatusPagamento(aluno.id);
        return {
          ...aluno,
          statusPagamento,
        };
      })
    );

    return {
      ...responsavel,
      alunos: alunosComStatus,
    };
  }

  async verifyResponsavelPassword(id: number, senhaAtual: string): Promise<boolean> {
    const responsavel = await this.getResponsavel(id);
    if (!responsavel) return false;
    return await bcrypt.compare(senhaAtual, responsavel.senha);
  }

  async updateResponsavel(id: number, data: Partial<Responsavel>): Promise<Responsavel> {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    // Se estiver atualizando a senha, criptografar
    if (data.senha) {
      updateData.senha = await bcrypt.hash(data.senha, 10);
    }

    const [updatedResponsavel] = await db
      .update(responsaveis)
      .set(updateData)
      .where(eq(responsaveis.id, id))
      .returning();
      
    return updatedResponsavel;
  }

  // Eventos operations
  async getEventos(): Promise<EventoWithFilial[]> {
    return await db
      .select({
        id: eventos.id,
        nome: eventos.nome,
        descricao: eventos.descricao,
        dataEvento: eventos.dataEvento,
        horaInicio: eventos.horaInicio,
        horaFim: eventos.horaFim,
        local: eventos.local,
        preco: eventos.preco,
        vagasMaximas: eventos.vagasMaximas,
        filialId: eventos.filialId,
        ativo: eventos.ativo,
        createdAt: eventos.createdAt,
        updatedAt: eventos.updatedAt,
        filial: filiais,
      })
      .from(eventos)
      .leftJoin(filiais, eq(eventos.filialId, filiais.id))
      .where(eq(eventos.ativo, true))
      .orderBy(desc(eventos.dataEvento));
  }

  async createEvento(evento: InsertEvento): Promise<Evento> {
    const [novoEvento] = await db
      .insert(eventos)
      .values(evento)
      .returning();
    return novoEvento;
  }

  async inscreveAlunoEvento(inscricao: InsertInscricaoEvento): Promise<InscricaoEvento> {
    const [novaInscricao] = await db
      .insert(inscricoesEventos)
      .values(inscricao)
      .returning();
    return novaInscricao;
  }



  // Notificações operations
  async getNotificacoesByResponsavel(responsavelId: number): Promise<Notificacao[]> {
    return await db
      .select()
      .from(notificacoes)
      .where(eq(notificacoes.responsavelId, responsavelId))
      .orderBy(desc(notificacoes.createdAt));
  }

  async createNotificacao(notificacao: InsertNotificacao): Promise<Notificacao> {
    const [novaNotificacao] = await db
      .insert(notificacoes)
      .values(notificacao)
      .returning();
    return novaNotificacao;
  }

  async marcarNotificacaoLida(id: number): Promise<void> {
    await db
      .update(notificacoes)
      .set({ lida: true })
      .where(eq(notificacoes.id, id));
  }

  // Presenças operations
  async getPresencas(): Promise<Presenca[]> {
    return await db
      .select()
      .from(presencas)
      .orderBy(desc(presencas.createdAt));
  }

  async getPresencasByTurmaData(turmaId: number, data: string): Promise<Presenca[]> {
    return await db
      .select()
      .from(presencas)
      .where(and(
        eq(presencas.turmaId, turmaId),
        eq(presencas.data, data)
      ))
      .orderBy(presencas.alunoId);
  }

  async getPresencasDetalhadas(): Promise<any[]> {
    const presencasComDetalhes = await db
      .select({
        id: presencas.id,
        alunoId: presencas.alunoId,
        turmaId: presencas.turmaId,
        data: presencas.data,
        presente: presencas.presente,
        observacoes: presencas.observacoes,
        createdAt: presencas.createdAt,
        alunoNome: alunos.nome,
        turmanome: turmas.nome,
        professorNome: professores.nome,
        filialNome: filiais.nome
      })
      .from(presencas)
      .leftJoin(alunos, eq(presencas.alunoId, alunos.id))
      .leftJoin(turmas, eq(presencas.turmaId, turmas.id))
      .leftJoin(professores, eq(turmas.professorId, professores.id))
      .leftJoin(filiais, eq(alunos.filialId, filiais.id))
      .orderBy(desc(presencas.createdAt));

    // Mapear para o formato esperado
    return presencasComDetalhes.map(p => ({
      id: p.id,
      alunoId: p.alunoId,
      turmaId: p.turmaId,
      data: p.data,
      presente: p.presente,
      observacoes: p.observacoes,
      createdAt: p.createdAt,
      aluno: {
        id: p.alunoId,
        nome: p.alunoNome,
        filial: {
          nome: p.filialNome
        }
      },
      turma: {
        id: p.turmaId,
        nome: p.turmanome,
        professor: {
          nome: p.professorNome
        }
      }
    }));
  }

  async registrarPresencas(presencasData: InsertPresenca[]): Promise<Presenca[]> {
    // Primeiro, deletar presenças existentes para a mesma turma e data
    if (presencasData.length > 0) {
      const { turmaId, data } = presencasData[0];
      await db
        .delete(presencas)
        .where(and(
          eq(presencas.turmaId, turmaId),
          eq(presencas.data, data)
        ));
    }

    // Inserir novas presenças
    const novasPresencas = await db
      .insert(presencas)
      .values(presencasData)
      .returning();

    return novasPresencas;
  }

  async createPresenca(presencaData: InsertPresenca): Promise<Presenca> {
    const [presenca] = await db
      .insert(presencas)
      .values(presencaData)
      .returning();
    return presenca;
  }

  // Uniformes operations
  async getUniformes(): Promise<Uniforme[]> {
    return await db.select().from(uniformes);
  }

  async createUniforme(uniformeData: InsertUniforme): Promise<Uniforme> {
    const [uniforme] = await db
      .insert(uniformes)
      .values(uniformeData)
      .returning();
    return uniforme;
  }

  async getComprasUniformes(): Promise<any[]> {
    const compras = await db
      .select({
        compra: comprasUniformes,
        uniforme: uniformes,
        aluno: alunos
      })
      .from(comprasUniformes)
      .leftJoin(uniformes, eq(comprasUniformes.uniformeId, uniformes.id))
      .leftJoin(alunos, eq(comprasUniformes.alunoId, alunos.id));

    return compras.map(row => ({
      ...row.compra,
      uniforme: row.uniforme,
      aluno: row.aluno
    }));
  }

  async comprarUniforme(compraData: InsertCompraUniforme): Promise<CompraUniforme> {
    const [compra] = await db
      .insert(comprasUniformes)
      .values(compraData)
      .returning();
    return compra;
  }

  async updateUniforme(id: number, uniformeData: Partial<InsertUniforme>): Promise<Uniforme> {
    const [uniforme] = await db
      .update(uniformes)
      .set({ ...uniformeData, updatedAt: new Date() })
      .where(eq(uniformes.id, id))
      .returning();
    return uniforme;
  }

  async deleteUniforme(id: number): Promise<void> {
    await db.delete(uniformes).where(eq(uniformes.id, id));
  }

  async createCompraUniforme(compraData: InsertCompraUniforme): Promise<CompraUniforme> {
    const [compra] = await db
      .insert(comprasUniformes)
      .values(compraData)
      .returning();
    return compra;
  }

  async updateCompraUniforme(id: number, data: Partial<InsertCompraUniforme>): Promise<CompraUniforme> {
    const [compra] = await db
      .update(comprasUniformes)
      .set(data)
      .where(eq(comprasUniformes.id, id))
      .returning();
    return compra;
  }

  async deleteCompraUniforme(id: number): Promise<void> {
    await db.delete(comprasUniformes).where(eq(comprasUniformes.id, id));
  }

  // Eventos operations  
  async getInscricoesEventos(): Promise<InscricaoEvento[]> {
    return await db.select().from(inscricoesEventos);
  }

  async createInscricaoEvento(inscricaoData: InsertInscricaoEvento): Promise<InscricaoEvento> {
    const [inscricao] = await db
      .insert(inscricoesEventos)
      .values(inscricaoData)
      .returning();
    return inscricao;
  }

  async updateInscricaoEvento(id: number, data: Partial<InsertInscricaoEvento>): Promise<InscricaoEvento> {
    const [inscricao] = await db
      .update(inscricoesEventos)
      .set(data)
      .where(eq(inscricoesEventos.id, id))
      .returning();
    return inscricao;
  }

  async updateEvento(id: number, eventoData: Partial<InsertEvento>): Promise<Evento> {
    const [evento] = await db
      .update(eventos)
      .set({ ...eventoData, updatedAt: new Date() })
      .where(eq(eventos.id, id))
      .returning();
    return evento;
  }

  async deleteEvento(id: number): Promise<void> {
    await db.delete(eventos).where(eq(eventos.id, id));
  }

  // Pacotes de treino operations
  async getPacotesTreino(): Promise<PacoteTreino[]> {
    return await db.select().from(pacotesTreino).where(eq(pacotesTreino.ativo, true));
  }

  async createPacoteTreino(pacoteData: InsertPacoteTreino): Promise<PacoteTreino> {
    const [pacote] = await db
      .insert(pacotesTreino)
      .values(pacoteData)
      .returning();
    return pacote;
  }

  async updatePacoteTreino(id: number, pacoteData: Partial<InsertPacoteTreino>): Promise<PacoteTreino> {
    const [pacote] = await db
      .update(pacotesTreino)
      .set({ ...pacoteData, updatedAt: new Date() })
      .where(eq(pacotesTreino.id, id))
      .returning();
    return pacote;
  }

  async deletePacoteTreino(id: number): Promise<void> {
    await db.delete(pacotesTreino).where(eq(pacotesTreino.id, id));
  }

  async createAssinaturaPacote(assinaturaData: InsertAssinaturaPacote): Promise<AssinaturaPacote> {
    const [assinatura] = await db
      .insert(assinaturasPacotes)
      .values(assinaturaData)
      .returning();
    return assinatura;
  }

  async getAssinaturasPacotes(): Promise<AssinaturaPacoteComplete[]> {
    const result = await db
      .select()
      .from(assinaturasPacotes)
      .leftJoin(alunos, eq(assinaturasPacotes.alunoId, alunos.id))
      .leftJoin(pacotesTreino, eq(assinaturasPacotes.pacoteId, pacotesTreino.id));

    return result.map(row => ({
      ...row.assinaturas_pacotes,
      aluno: row.alunos || {},
      pacote: row.pacotes_treino || {}
    })) as AssinaturaPacoteComplete[];
  }

  async criarAssinaturaPacote(assinaturaData: InsertAssinaturaPacote): Promise<AssinaturaPacote> {
    const [assinatura] = await db
      .insert(assinaturasPacotes)
      .values(assinaturaData)
      .returning();
    return assinatura;
  }

  // Physical evaluation operations
  async getCategoriasTestes(): Promise<CategoriaTeste[]> {
    return await db.select().from(categoriasTestes).where(eq(categoriasTestes.ativo, true));
  }

  async createCategoriaTeste(categoriaData: InsertCategoriaTeste): Promise<CategoriaTeste> {
    const [categoria] = await db
      .insert(categoriasTestes)
      .values(categoriaData)
      .returning();
    return categoria;
  }

  async updateCategoriaTeste(id: number, categoriaData: Partial<InsertCategoriaTeste>): Promise<CategoriaTeste> {
    const [categoria] = await db
      .update(categoriasTestes)
      .set({
        ...categoriaData,
        updatedAt: new Date(),
      })
      .where(eq(categoriasTestes.id, id))
      .returning();
    return categoria;
  }

  async deleteCategoriaTeste(id: number): Promise<void> {
    await db.delete(categoriasTestes).where(eq(categoriasTestes.id, id));
  }

  async getTestes(): Promise<TesteWithCategoria[]> {
    const result = await db
      .select()
      .from(testes)
      .leftJoin(categoriasTestes, eq(testes.categoriaId, categoriasTestes.id))
      .where(eq(testes.ativo, true));

    return result.map(row => ({
      ...row.testes,
      categoria: row.categorias_testes || {} as CategoriaTeste
    })) as TesteWithCategoria[];
  }

  async getTestesByCategoria(categoriaId: number): Promise<TesteWithCategoria[]> {
    const result = await db
      .select()
      .from(testes)
      .leftJoin(categoriasTestes, eq(testes.categoriaId, categoriasTestes.id))
      .where(and(eq(testes.categoriaId, categoriaId), eq(testes.ativo, true)));

    return result.map(row => ({
      ...row.testes,
      categoria: row.categorias_testes || {} as CategoriaTeste
    })) as TesteWithCategoria[];
  }

  async createTeste(testeData: InsertTeste): Promise<Teste> {
    const [teste] = await db
      .insert(testes)
      .values(testeData)
      .returning();
    return teste;
  }

  async updateTeste(id: number, testeData: Partial<InsertTeste>): Promise<Teste> {
    const [teste] = await db
      .update(testes)
      .set({
        ...testeData,
        updatedAt: new Date(),
      })
      .where(eq(testes.id, id))
      .returning();
    return teste;
  }

  async deleteTeste(id: number): Promise<void> {
    await db.delete(testes).where(eq(testes.id, id));
  }

  async getAvaliacoesFisicas(): Promise<AvaliacaoFisicaComplete[]> {
    const result = await db
      .select()
      .from(avaliacoesFisicas)
      .leftJoin(alunos, eq(avaliacoesFisicas.alunoId, alunos.id))
      .leftJoin(professores, eq(avaliacoesFisicas.professorId, professores.id))
      .leftJoin(filiais, eq(avaliacoesFisicas.filialId, filiais.id));

    const avaliacoes = result.map(row => ({
      ...row.avaliacoes_fisicas,
      aluno: row.alunos || {} as Aluno,
      professor: row.professores || {} as Professor,
      filial: row.filiais || null,
      resultados: []
    })) as AvaliacaoFisicaComplete[];

    // Get resultados for each avaliacao
    for (const avaliacao of avaliacoes) {
      const resultados = await this.getResultadosByAvaliacao(avaliacao.id);
      avaliacao.resultados = resultados.map(resultado => ({
        ...resultado,
        teste: {} as TesteWithCategoria
      }));
    }

    return avaliacoes;
  }

  async getAvaliacoesByAluno(alunoId: number): Promise<AvaliacaoFisicaComplete[]> {
    const result = await db
      .select()
      .from(avaliacoesFisicas)
      .leftJoin(alunos, eq(avaliacoesFisicas.alunoId, alunos.id))
      .leftJoin(professores, eq(avaliacoesFisicas.professorId, professores.id))
      .leftJoin(filiais, eq(avaliacoesFisicas.filialId, filiais.id))
      .where(eq(avaliacoesFisicas.alunoId, alunoId));

    return result.map(row => ({
      ...row.avaliacoes_fisicas,
      aluno: row.alunos || {} as Aluno,
      professor: row.professores || {} as Professor,
      filial: row.filiais || null,
      resultados: []
    })) as AvaliacaoFisicaComplete[];
  }

  async getAvaliacoesByFilial(filialId: number): Promise<AvaliacaoFisicaComplete[]> {
    const result = await db
      .select()
      .from(avaliacoesFisicas)
      .leftJoin(alunos, eq(avaliacoesFisicas.alunoId, alunos.id))
      .leftJoin(professores, eq(avaliacoesFisicas.professorId, professores.id))
      .leftJoin(filiais, eq(avaliacoesFisicas.filialId, filiais.id))
      .where(eq(avaliacoesFisicas.filialId, filialId));

    return result.map(row => ({
      ...row.avaliacoes_fisicas,
      aluno: row.alunos || {} as Aluno,
      professor: row.professores || {} as Professor,
      filial: row.filiais || null,
      resultados: []
    })) as AvaliacaoFisicaComplete[];
  }

  async createAvaliacaoFisica(avaliacaoData: InsertAvaliacaoFisica): Promise<AvaliacaoFisica> {
    const [avaliacao] = await db
      .insert(avaliacoesFisicas)
      .values(avaliacaoData)
      .returning();
    return avaliacao;
  }

  async updateAvaliacaoFisica(id: number, avaliacaoData: Partial<InsertAvaliacaoFisica>): Promise<AvaliacaoFisica> {
    const [avaliacao] = await db
      .update(avaliacoesFisicas)
      .set({
        ...avaliacaoData,
        updatedAt: new Date(),
      })
      .where(eq(avaliacoesFisicas.id, id))
      .returning();
    return avaliacao;
  }

  async deleteAvaliacaoFisica(id: number): Promise<void> {
    // Delete related resultados first
    await db.delete(resultadosTestes).where(eq(resultadosTestes.avaliacaoId, id));
    // Then delete the avaliacao
    await db.delete(avaliacoesFisicas).where(eq(avaliacoesFisicas.id, id));
  }

  // Gestores de Unidade operations
  async getGestorUnidade(id: number): Promise<GestorUnidade | undefined> {
    const [gestor] = await db
      .select()
      .from(gestoresUnidade)
      .where(eq(gestoresUnidade.id, id));
    return gestor;
  }

  async getGestorUnidadeByEmail(email: string): Promise<GestorUnidade | undefined> {
    const [gestor] = await db
      .select()
      .from(gestoresUnidade)
      .where(eq(gestoresUnidade.email, email));
    return gestor;
  }

  async createGestorUnidade(gestorData: InsertGestorUnidade): Promise<GestorUnidade> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(gestorData.senha, 10);
    
    const [gestor] = await db
      .insert(gestoresUnidade)
      .values({
        ...gestorData,
        senha: hashedPassword,
      })
      .returning();
    return gestor;
  }

  async authenticateGestorUnidade(email: string, senha: string): Promise<GestorUnidadeWithFilial | null> {
    const gestor = await this.getGestorUnidadeByEmail(email);
    if (!gestor || !gestor.ativo) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(senha, gestor.senha);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await this.updateGestorUltimoLogin(gestor.id);

    // Get filial information
    const filial = await this.getFilial(gestor.filialId);
    
    return {
      ...gestor,
      filial: filial || null,
    };
  }

  async updateGestorUltimoLogin(id: number): Promise<void> {
    await db
      .update(gestoresUnidade)
      .set({
        ultimoLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gestoresUnidade.id, id));
  }

  async getResultadosTestes(): Promise<ResultadoTeste[]> {
    return await db.select().from(resultadosTestes);
  }

  async getResultadosByAvaliacao(avaliacaoId: number): Promise<ResultadoTeste[]> {
    return await db
      .select()
      .from(resultadosTestes)
      .where(eq(resultadosTestes.avaliacaoId, avaliacaoId));
  }

  async createResultadoTeste(resultadoData: InsertResultadoTeste): Promise<ResultadoTeste> {
    const [resultado] = await db
      .insert(resultadosTestes)
      .values(resultadoData)
      .returning();
    return resultado;
  }

  async updateResultadoTeste(id: number, resultadoData: Partial<InsertResultadoTeste>): Promise<ResultadoTeste> {
    const [resultado] = await db
      .update(resultadosTestes)
      .set(resultadoData)
      .where(eq(resultadosTestes.id, id))
      .returning();
    return resultado;
  }

  async deleteResultadoTeste(id: number): Promise<void> {
    await db.delete(resultadosTestes).where(eq(resultadosTestes.id, id));
  }

  async getMetasAlunos(): Promise<MetaAlunoComplete[]> {
    const result = await db
      .select()
      .from(metasAlunos)
      .leftJoin(alunos, eq(metasAlunos.alunoId, alunos.id))
      .leftJoin(testes, eq(metasAlunos.testeId, testes.id))
      .leftJoin(categoriasTestes, eq(testes.categoriaId, categoriasTestes.id))
      .leftJoin(professores, eq(metasAlunos.definidoPor, professores.id));

    return result.map(row => ({
      ...row.metas_alunos,
      aluno: row.alunos || {} as Aluno,
      teste: {
        ...row.testes || {} as Teste,
        categoria: row.categorias_testes || {} as CategoriaTeste
      } as TesteWithCategoria,
      definidoPorProfessor: row.professores || null
    })) as MetaAlunoComplete[];
  }

  async getMetasByAluno(alunoId: number): Promise<MetaAlunoComplete[]> {
    const result = await db
      .select()
      .from(metasAlunos)
      .leftJoin(alunos, eq(metasAlunos.alunoId, alunos.id))
      .leftJoin(testes, eq(metasAlunos.testeId, testes.id))
      .leftJoin(categoriasTestes, eq(testes.categoriaId, categoriasTestes.id))
      .leftJoin(professores, eq(metasAlunos.definidoPor, professores.id))
      .where(eq(metasAlunos.alunoId, alunoId));

    return result.map(row => ({
      ...row.metas_alunos,
      aluno: row.alunos || {} as Aluno,
      teste: {
        ...row.testes || {} as Teste,
        categoria: row.categorias_testes || {} as CategoriaTeste
      } as TesteWithCategoria,
      definidoPorProfessor: row.professores || null
    })) as MetaAlunoComplete[];
  }

  async createMetaAluno(metaData: InsertMetaAluno): Promise<MetaAluno> {
    const [meta] = await db
      .insert(metasAlunos)
      .values(metaData)
      .returning();
    return meta;
  }

  async updateMetaAluno(id: number, metaData: Partial<InsertMetaAluno>): Promise<MetaAluno> {
    const [meta] = await db
      .update(metasAlunos)
      .set({
        ...metaData,
        updatedAt: new Date(),
      })
      .where(eq(metasAlunos.id, id))
      .returning();
    return meta;
  }

  async deleteMetaAluno(id: number): Promise<void> {
    await db.delete(metasAlunos).where(eq(metasAlunos.id, id));
  }

  // Combos de Aulas operations
  async getCombosAulas(): Promise<any[]> {
    return await db
      .select()
      .from(combosAulas)
      .where(eq(combosAulas.ativo, true))
      .orderBy(desc(combosAulas.createdAt));
  }

  async createComboAulas(comboData: any): Promise<any> {
    const [combo] = await db
      .insert(combosAulas)
      .values(comboData)
      .returning();
    return combo;
  }

  async updateComboAulas(id: number, comboData: any): Promise<any> {
    const [combo] = await db
      .update(combosAulas)
      .set({ ...comboData, updatedAt: new Date() })
      .where(eq(combosAulas.id, id))
      .returning();
    return combo;
  }

  async deleteComboAulas(id: number): Promise<void> {
    await db.delete(combosAulas).where(eq(combosAulas.id, id));
  }

  // Guardian portal operations
  async getAlunoForGuardian(alunoId: number, responsavelId: number): Promise<AlunoWithTurmas | undefined> {
    // Verify the aluno belongs to the responsavel
    const [aluno] = await db
      .select()
      .from(alunos)
      .where(and(eq(alunos.id, alunoId), eq(alunos.responsavelId, responsavelId)))
      .limit(1);
    
    if (!aluno) {
      return undefined;
    }

    return await this.getAluno(alunoId);
  }

  async updateAlunoContact(alunoId: number, responsavelId: number, data: any): Promise<Aluno> {
    // First verify ownership
    const aluno = await this.getAlunoForGuardian(alunoId, responsavelId);
    if (!aluno) {
      throw new Error("Aluno not found or unauthorized");
    }

    const [updated] = await db
      .update(alunos)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(alunos.id, alunoId))
      .returning();
    
    return updated;
  }

  async getTurmasByAluno(alunoId: number, responsavelId: number): Promise<TurmaWithProfessor[]> {
    // Verify ownership first
    const aluno = await this.getAlunoForGuardian(alunoId, responsavelId);
    if (!aluno) {
      return [];
    }

    const result = await db
      .select()
      .from(turmas)
      .leftJoin(professores, eq(turmas.professorId, professores.id))
      .leftJoin(filiais, eq(turmas.filialId, filiais.id))
      .leftJoin(matriculas, eq(matriculas.turmaId, turmas.id))
      .where(and(
        eq(matriculas.alunoId, alunoId),
        eq(turmas.ativo, true)
      ));

    return result.map(row => ({
      ...row.turmas,
      professor: row.professores,
      filial: row.filiais
    })) as TurmaWithProfessor[];
  }

  async getEventosDisponiveisByFilial(filialId: number): Promise<EventoWithFilial[]> {
    const result = await db
      .select()
      .from(eventos)
      .leftJoin(filiais, eq(eventos.filialId, filiais.id))
      .where(and(
        eq(eventos.filialId, filialId),
        eq(eventos.ativo, true)
      ))
      .orderBy(eventos.dataEvento);

    return result.map(row => ({
      ...row.eventos,
      filial: row.filiais
    })) as EventoWithFilial[];
  }

  async createGuardianInscricao(
    eventoId: number, 
    alunoId: number, 
    responsavelId: number,
    observacoes?: string
  ): Promise<InscricaoEvento> {
    // Verify aluno ownership
    const aluno = await this.getAlunoForGuardian(alunoId, responsavelId);
    if (!aluno) {
      throw new Error("Aluno not found or unauthorized");
    }

    // Get evento and verify it's in the same filial
    const [evento] = await db
      .select()
      .from(eventos)
      .where(eq(eventos.id, eventoId))
      .limit(1);

    if (!evento) {
      throw new Error("Evento not found");
    }

    if (evento.filialId !== aluno.filialId) {
      throw new Error("Evento not available for this student's unit");
    }

    if (!evento.ativo) {
      throw new Error("Evento is not active");
    }

    // Check for duplicate inscription
    const [existing] = await db
      .select()
      .from(inscricoesEventos)
      .where(and(
        eq(inscricoesEventos.eventoId, eventoId),
        eq(inscricoesEventos.alunoId, alunoId)
      ))
      .limit(1);

    if (existing) {
      throw new Error("Student already enrolled in this event");
    }

    // Create inscription
    const [inscricao] = await db
      .insert(inscricoesEventos)
      .values({
        eventoId,
        alunoId,
        statusPagamento: "pendente",
        observacoes: observacoes || null,
      })
      .returning();

    return inscricao;
  }

  async createGuardianCompra(
    uniformeId: number,
    alunoId: number,
    responsavelId: number,
    tamanho: string,
    cor: string,
    quantidade: number
  ): Promise<CompraUniforme> {
    // Verify aluno ownership
    const aluno = await this.getAlunoForGuardian(alunoId, responsavelId);
    if (!aluno) {
      throw new Error("Aluno not found or unauthorized");
    }

    // Get uniforme and verify stock
    const [uniforme] = await db
      .select()
      .from(uniformes)
      .where(eq(uniformes.id, uniformeId))
      .limit(1);

    if (!uniforme) {
      throw new Error("Uniforme not found");
    }

    if (!uniforme.ativo) {
      throw new Error("Uniforme is not available");
    }

    const currentStock = uniforme.estoque ?? 0;
    if (currentStock < quantidade) {
      throw new Error("Insufficient stock");
    }

    // Verify size and color are available
    let tamanhos: string[] = [];
    let cores: string[] = [];

    try {
      tamanhos = JSON.parse(uniforme.tamanhos);
    } catch (e) {
      tamanhos = uniforme.tamanhos.split(',').map(s => s.trim());
    }

    try {
      cores = JSON.parse(uniforme.cores);
    } catch (e) {
      cores = uniforme.cores.split(',').map(s => s.trim());
    }

    if (!tamanhos.includes(tamanho)) {
      throw new Error("Tamanho não disponível: " + tamanho);
    }

    if (!cores.includes(cor)) {
      throw new Error("Cor não disponível: " + cor);
    }

    // Calculate total price
    const precoUnitario = parseFloat(uniforme.preco);
    const precoTotal = (precoUnitario * quantidade).toFixed(2);

    // Create purchase and update stock atomically
    const [compra] = await db
      .insert(comprasUniformes)
      .values({
        uniformeId,
        alunoId,
        tamanho,
        cor,
        quantidade,
        preco: precoTotal,
        statusPagamento: "pendente",
      })
      .returning();

    // Update stock
    await db
      .update(uniformes)
      .set({ estoque: currentStock - quantidade })
      .where(eq(uniformes.id, uniformeId));

    return compra;
  }

  async getPagamentosByAlunoForGuardian(alunoId: number, responsavelId: number): Promise<Pagamento[]> {
    // Verify ownership
    const aluno = await this.getAlunoForGuardian(alunoId, responsavelId);
    if (!aluno) {
      return [];
    }

    return await db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.alunoId, alunoId))
      .orderBy(desc(pagamentos.createdAt));
  }

  async getInscricoesEventosByAluno(alunoId: number): Promise<InscricaoEvento[]> {
    return await db
      .select()
      .from(inscricoesEventos)
      .where(eq(inscricoesEventos.alunoId, alunoId))
      .orderBy(desc(inscricoesEventos.id));
  }

  // System configuration methods
  async getConfiguracoes(): Promise<ConfiguracoesSistema | null> {
    const result = await db.select().from(configuracoesSistema).limit(1);
    return result[0] || null;
  }

  async updateConfiguracoes(data: Partial<InsertConfiguracoesSistema>): Promise<ConfiguracoesSistema> {
    const existing = await this.getConfiguracoes();
    if (existing) {
      const [updated] = await db
        .update(configuracoesSistema)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(configuracoesSistema.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(configuracoesSistema)
        .values(data)
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
