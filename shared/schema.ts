import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Responsáveis table
export const responsaveis = pgTable("responsaveis", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  senha: varchar("senha", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }).unique(),
  endereco: text("endereco"),
  bairro: varchar("bairro", { length: 100 }),
  cep: varchar("cep", { length: 10 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alunos table
export const alunos = pgTable("alunos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  rg: varchar("rg", { length: 20 }),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  dataNascimento: date("data_nascimento"),
  dataMatricula: date("data_matricula").defaultNow(),
  fotoUrl: text("foto_url"),
  endereco: text("endereco"),
  bairro: varchar("bairro", { length: 100 }),
  cep: varchar("cep", { length: 10 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  apartamento: varchar("apartamento", { length: 50 }),
  bloco: varchar("bloco", { length: 50 }),
  responsavelId: integer("responsavel_id").references(() => responsaveis.id),
  nomeResponsavel: varchar("nome_responsavel", { length: 255 }),
  telefoneResponsavel: varchar("telefone_responsavel", { length: 20 }),
  filialId: integer("filial_id").references(() => filiais.id),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Professores table
export const professores = pgTable("professores", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  telefone: varchar("telefone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  rg: varchar("rg", { length: 20 }),
  dataAdmissao: date("data_admissao"),
  especialidade: varchar("especialidade", { length: 100 }),
  calendarioSemanal: text("calendario_semanal"), // JSON com dias e horários
  horariosTrabalho: text("horarios_trabalho"), // JSON com horários detalhados
  filialId: integer("filial_id").references(() => filiais.id),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Filiais table
export const filiais = pgTable("filiais", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  endereco: text("endereco").notNull(),
  bairro: varchar("bairro", { length: 100 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  email: varchar("email", { length: 255 }),
  cnpj: varchar("cnpj", { length: 18 }),
  senha: varchar("senha", { length: 255 }), // Hash da senha para acesso ao painel
  telefone: varchar("telefone", { length: 20 }),
  responsavel: varchar("responsavel", { length: 100 }),
  horarioFuncionamento: varchar("horario_funcionamento", { length: 100 }),
  fotoFundoUrl: text("foto_fundo_url"), // URL da imagem de fundo para o portal da unidade
  isMatriz: boolean("is_matriz").default(false),
  ativa: boolean("ativa").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gestores de Unidades table
export const gestoresUnidade = pgTable("gestores_unidade", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  senha: varchar("senha", { length: 255 }).notNull(), // Hash da senha
  filialId: integer("filial_id").references(() => filiais.id).notNull(),
  ativo: boolean("ativo").default(true),
  papel: varchar("papel", { length: 50 }).default("gestor"), // gestor, supervisor, admin_unidade
  telefone: varchar("telefone", { length: 20 }),
  ultimoLogin: timestamp("ultimo_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Turmas table
export const turmas = pgTable("turmas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  categoria: varchar("categoria", { length: 100 }).notNull(), // Baby fut, Sub 07/08, Sub 09/10, Sub 11/12, Sub 13/14, Sub 15 á 17
  professorId: integer("professor_id").references(() => professores.id),
  filialId: integer("filial_id").references(() => filiais.id),
  horario: varchar("horario", { length: 100 }),
  diasSemana: varchar("dias_semana", { length: 50 }), // "Segunda,Quarta,Sexta"
  capacidadeMaxima: integer("capacidade_maxima").default(20),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matrículas table (relaciona alunos com turmas)
export const matriculas = pgTable("matriculas", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").references(() => alunos.id),
  turmaId: integer("turma_id").references(() => turmas.id),
  dataMatricula: date("data_matricula").defaultNow(),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Planos Financeiros table
export const planosFinanceiros = pgTable("planos_financeiros", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(), // Ex: "Mensal", "Trimestral", "Semestral", "Anual"
  descricao: text("descricao"),
  valorMensal: decimal("valor_mensal", { precision: 10, scale: 2 }).notNull(),
  quantidadeMeses: integer("quantidade_meses").notNull().default(1), // 1, 3, 6, 12
  descontoPercentual: decimal("desconto_percentual", { precision: 5, scale: 2 }).default("0"), // Desconto para planos maiores
  valorTotal: decimal("valor_total", { precision: 10, scale: 2 }), // Valor total com desconto
  diaVencimento: integer("dia_vencimento").default(10), // Dia do mês para vencimento
  taxaMatricula: decimal("taxa_matricula", { precision: 10, scale: 2 }).default("0"),
  filialId: integer("filial_id").references(() => filiais.id), // Plano específico por filial ou null para todas
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pagamentos table
export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").references(() => alunos.id),
  planoId: integer("plano_id").references(() => planosFinanceiros.id), // Referência ao plano
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  mesReferencia: varchar("mes_referencia", { length: 7 }).notNull(), // "2024-01"
  dataPagamento: date("data_pagamento").notNull(),
  dataVencimento: date("data_vencimento"), // Data de vencimento da mensalidade
  formaPagamento: varchar("forma_pagamento", { length: 50 }).notNull(), // Dinheiro, PIX, Cartão
  status: varchar("status", { length: 20 }).default("pago"), // pago, pendente, atrasado, cancelado
  mercadopagoId: varchar("mercadopago_id", { length: 255 }),
  mercadopagoStatus: varchar("mercadopago_status", { length: 50 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Eventos table
export const eventos = pgTable("eventos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  dataEvento: date("data_evento").notNull(),
  horaInicio: varchar("hora_inicio", { length: 5 }),
  horaFim: varchar("hora_fim", { length: 5 }),
  local: varchar("local", { length: 255 }),
  preco: decimal("preco", { precision: 10, scale: 2 }).default("0"),
  vagasMaximas: integer("vagas_maximas"),
  filialId: integer("filial_id").references(() => filiais.id),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Uniformes table
export const uniformes = pgTable("uniformes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  tamanhos: text("tamanhos").notNull(), // JSON array: ["P", "M", "G", "GG"]
  cores: text("cores").notNull(), // JSON array: ["Azul", "Branco", "Verde"]
  categoria: varchar("categoria", { length: 100 }), // Camiseta, Shorts, Chuteira, etc.
  imagemUrl: text("imagem_url"), // URL da imagem do uniforme
  estoque: integer("estoque").default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inscrições de eventos table
export const inscricoesEventos = pgTable("inscricoes_eventos", {
  id: serial("id").primaryKey(),
  eventoId: integer("evento_id").references(() => eventos.id),
  alunoId: integer("aluno_id").references(() => alunos.id),
  dataInscricao: timestamp("data_inscricao").defaultNow(),
  statusPagamento: varchar("status_pagamento", { length: 20 }).default("pendente"), // pendente, pago, cancelado
  statusConfirmacao: varchar("status_confirmacao", { length: 20 }).default("inscrito"), // inscrito, confirmado, cancelado
  mercadopagoId: varchar("mercadopago_id", { length: 255 }),
  mercadopagoStatus: varchar("mercadopago_status", { length: 50 }),
  observacoes: text("observacoes"),
});

// Compras de uniformes table
export const comprasUniformes = pgTable("compras_uniformes", {
  id: serial("id").primaryKey(),
  uniformeId: integer("uniforme_id").references(() => uniformes.id),
  alunoId: integer("aluno_id").references(() => alunos.id),
  tamanho: varchar("tamanho", { length: 10 }).notNull(),
  cor: varchar("cor", { length: 50 }).notNull(),
  quantidade: integer("quantidade").default(1),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  dataCompra: timestamp("data_compra").defaultNow(),
  statusPagamento: varchar("status_pagamento", { length: 20 }).default("pendente"),
  mercadopagoId: varchar("mercadopago_id", { length: 255 }),
  mercadopagoStatus: varchar("mercadopago_status", { length: 50 }),
  statusEntrega: varchar("status_entrega", { length: 20 }).default("preparando"), // preparando, entregue
});

// Notificações table
export const notificacoes = pgTable("notificacoes", {
  id: serial("id").primaryKey(),
  responsavelId: integer("responsavel_id").references(() => responsaveis.id),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem").notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // pagamento, evento, uniforme, geral
  lida: boolean("lida").default(false),
  dataVencimento: date("data_vencimento"), // Para notificações de pagamento
  createdAt: timestamp("created_at").defaultNow(),
});

// Presenças table (lista de chamada)
export const presencas = pgTable("presencas", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").references(() => alunos.id).notNull(),
  turmaId: integer("turma_id").references(() => turmas.id).notNull(),
  data: date("data").notNull(),
  presente: boolean("presente").notNull(),
  observacoes: text("observacoes"),
  registradoPor: integer("registrado_por").references(() => professores.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Avaliações Físicas - Categorias de testes
export const categoriasTestes = pgTable("categorias_testes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(), // Ex: "Resistência", "Velocidade", "Força"
  descricao: text("descricao"),
  unidadeMedida: varchar("unidade_medida", { length: 20 }), // Ex: "segundos", "metros", "repetições"
  tipoTeste: varchar("tipo_teste", { length: 50 }).notNull(), // "fisico", "tecnico", "antropometrico"
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Testes específicos dentro de cada categoria
export const testes = pgTable("testes", {
  id: serial("id").primaryKey(),
  categoriaId: integer("categoria_id").references(() => categoriasTestes.id).notNull(),
  nome: varchar("nome", { length: 150 }).notNull(), // Ex: "Corrida de 20 metros", "Flexão de braço"
  descricao: text("descricao"),
  instrucoes: text("instrucoes"), // Como executar o teste
  unidadeMedida: varchar("unidade_medida", { length: 20 }), // Ex: "segundos", "repetições"
  valorMinimo: decimal("valor_minimo", { precision: 10, scale: 2 }), // Para validação
  valorMaximo: decimal("valor_maximo", { precision: 10, scale: 2 }), // Para validação
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Avaliações físicas - cabeçalho da avaliação
export const avaliacoesFisicas = pgTable("avaliacoes_fisicas", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").references(() => alunos.id).notNull(),
  professorId: integer("professor_id").references(() => professores.id).notNull(),
  dataAvaliacao: date("data_avaliacao").notNull(),
  pesoKg: decimal("peso_kg", { precision: 5, scale: 2 }), // Peso em kg
  alturaM: decimal("altura_m", { precision: 3, scale: 2 }), // Altura em metros
  imc: decimal("imc", { precision: 4, scale: 2 }), // Calculado automaticamente
  observacoesGerais: text("observacoes_gerais"),
  recomendacoes: text("recomendacoes"),
  proximaAvaliacao: date("proxima_avaliacao"),
  filialId: integer("filial_id").references(() => filiais.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resultados individuais dos testes em cada avaliação
export const resultadosTestes = pgTable("resultados_testes", {
  id: serial("id").primaryKey(),
  avaliacaoId: integer("avaliacao_id").references(() => avaliacoesFisicas.id).notNull(),
  testeId: integer("teste_id").references(() => testes.id).notNull(),
  resultado: decimal("resultado", { precision: 10, scale: 2 }).notNull(), // Valor obtido no teste
  tentativa: integer("tentativa").default(1), // Para testes com múltiplas tentativas
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Metas e objetivos para cada aluno
export const metasAlunos = pgTable("metas_alunos", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").references(() => alunos.id).notNull(),
  testeId: integer("teste_id").references(() => testes.id).notNull(),
  valorMeta: decimal("valor_meta", { precision: 10, scale: 2 }).notNull(),
  dataDefinicao: date("data_definicao").defaultNow(),
  dataPrazo: date("data_prazo"),
  status: varchar("status", { length: 20 }).default("ativa"), // ativa, atingida, cancelada
  observacoes: text("observacoes"),
  definidoPor: integer("definido_por").references(() => professores.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const responsaveisRelations = relations(responsaveis, ({ many }) => ({
  alunos: many(alunos),
  notificacoes: many(notificacoes),
}));

export const alunosRelations = relations(alunos, ({ one, many }) => ({
  responsavel: one(responsaveis, {
    fields: [alunos.responsavelId],
    references: [responsaveis.id],
  }),
  filial: one(filiais, {
    fields: [alunos.filialId],
    references: [filiais.id],
  }),
  matriculas: many(matriculas),
  pagamentos: many(pagamentos),
  inscricoesEventos: many(inscricoesEventos),
  comprasUniformes: many(comprasUniformes),
  presencas: many(presencas),
  avaliacoesFisicas: many(avaliacoesFisicas),
  metasAlunos: many(metasAlunos),
}));

export const professoresRelations = relations(professores, ({ one, many }) => ({
  turmas: many(turmas),
  filial: one(filiais, {
    fields: [professores.filialId],
    references: [filiais.id],
  }),
  presencasRegistradas: many(presencas),
  avaliacoesFisicas: many(avaliacoesFisicas),
  metasDefinidas: many(metasAlunos),
}));

export const filiaisRelations = relations(filiais, ({ many }) => ({
  turmas: many(turmas),
  alunos: many(alunos),
  professores: many(professores),
  gestores: many(gestoresUnidade),
}));

export const gestoresUnidadeRelations = relations(gestoresUnidade, ({ one }) => ({
  filial: one(filiais, {
    fields: [gestoresUnidade.filialId],
    references: [filiais.id],
  }),
}));

export const turmasRelations = relations(turmas, ({ one, many }) => ({
  professor: one(professores, {
    fields: [turmas.professorId],
    references: [professores.id],
  }),
  filial: one(filiais, {
    fields: [turmas.filialId],
    references: [filiais.id],
  }),
  matriculas: many(matriculas),
  presencas: many(presencas),
}));

export const matriculasRelations = relations(matriculas, ({ one }) => ({
  aluno: one(alunos, {
    fields: [matriculas.alunoId],
    references: [alunos.id],
  }),
  turma: one(turmas, {
    fields: [matriculas.turmaId],
    references: [turmas.id],
  }),
}));

export const pagamentosRelations = relations(pagamentos, ({ one }) => ({
  aluno: one(alunos, {
    fields: [pagamentos.alunoId],
    references: [alunos.id],
  }),
}));

export const eventosRelations = relations(eventos, ({ one, many }) => ({
  filial: one(filiais, {
    fields: [eventos.filialId],
    references: [filiais.id],
  }),
  inscricoes: many(inscricoesEventos),
}));

export const uniformesRelations = relations(uniformes, ({ many }) => ({
  compras: many(comprasUniformes),
}));

export const inscricoesEventosRelations = relations(inscricoesEventos, ({ one }) => ({
  evento: one(eventos, {
    fields: [inscricoesEventos.eventoId],
    references: [eventos.id],
  }),
  aluno: one(alunos, {
    fields: [inscricoesEventos.alunoId],
    references: [alunos.id],
  }),
}));

export const comprasUniformesRelations = relations(comprasUniformes, ({ one }) => ({
  uniforme: one(uniformes, {
    fields: [comprasUniformes.uniformeId],
    references: [uniformes.id],
  }),
  aluno: one(alunos, {
    fields: [comprasUniformes.alunoId],
    references: [alunos.id],
  }),
}));

export const notificacoesRelations = relations(notificacoes, ({ one }) => ({
  responsavel: one(responsaveis, {
    fields: [notificacoes.responsavelId],
    references: [responsaveis.id],
  }),
}));

export const presencasRelations = relations(presencas, ({ one }) => ({
  aluno: one(alunos, {
    fields: [presencas.alunoId],
    references: [alunos.id],
  }),
  turma: one(turmas, {
    fields: [presencas.turmaId],
    references: [turmas.id],
  }),
  professor: one(professores, {
    fields: [presencas.registradoPor],
    references: [professores.id],
  }),
}));

// Pacotes de treino
export const pacotesTreino = pgTable("pacotes_treino", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  frequenciaSemanal: integer("frequencia_semanal").notNull(), // 1, 2 ou 3 vezes por semana
  valor: varchar("valor", { length: 20 }).notNull(),
  duracao: integer("duracao").notNull(), // duração em dias
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assinaturas de pacotes pelos alunos
export const assinaturasPacotes = pgTable("assinaturas_pacotes", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").references(() => alunos.id),
  pacoteId: integer("pacote_id").references(() => pacotesTreino.id),
  dataInicio: varchar("data_inicio", { length: 10 }).notNull(), // YYYY-MM-DD
  dataFim: varchar("data_fim", { length: 10 }).notNull(), // YYYY-MM-DD
  status: varchar("status", { length: 20 }).notNull().default("ativo"), // ativo, pausado, cancelado
  valorPago: varchar("valor_pago", { length: 20 }).notNull(),
  formaPagamento: varchar("forma_pagamento", { length: 50 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pacotesTreinoRelations = relations(pacotesTreino, ({ many }) => ({
  assinaturas: many(assinaturasPacotes),
}));

export const assinaturasPacotesRelations = relations(assinaturasPacotes, ({ one }) => ({
  aluno: one(alunos, {
    fields: [assinaturasPacotes.alunoId],
    references: [alunos.id],
  }),
  pacote: one(pacotesTreino, {
    fields: [assinaturasPacotes.pacoteId],
    references: [pacotesTreino.id],
  }),
}));

// Combos de Aulas
export const combosAulas = pgTable("combos_aulas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  aulasPorSemana: integer("aulas_por_semana").notNull(),
  duracaoMeses: integer("duracao_meses").notNull(),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Physical evaluation relations
export const categoriasTestesRelations = relations(categoriasTestes, ({ many }) => ({
  testes: many(testes),
}));

export const testesRelations = relations(testes, ({ one, many }) => ({
  categoria: one(categoriasTestes, {
    fields: [testes.categoriaId],
    references: [categoriasTestes.id],
  }),
  resultados: many(resultadosTestes),
  metas: many(metasAlunos),
}));

export const avaliacoesFisicasRelations = relations(avaliacoesFisicas, ({ one, many }) => ({
  aluno: one(alunos, {
    fields: [avaliacoesFisicas.alunoId],
    references: [alunos.id],
  }),
  professor: one(professores, {
    fields: [avaliacoesFisicas.professorId],
    references: [professores.id],
  }),
  filial: one(filiais, {
    fields: [avaliacoesFisicas.filialId],
    references: [filiais.id],
  }),
  resultados: many(resultadosTestes),
}));

export const resultadosTestesRelations = relations(resultadosTestes, ({ one }) => ({
  avaliacao: one(avaliacoesFisicas, {
    fields: [resultadosTestes.avaliacaoId],
    references: [avaliacoesFisicas.id],
  }),
  teste: one(testes, {
    fields: [resultadosTestes.testeId],
    references: [testes.id],
  }),
}));

export const metasAlunosRelations = relations(metasAlunos, ({ one }) => ({
  aluno: one(alunos, {
    fields: [metasAlunos.alunoId],
    references: [alunos.id],
  }),
  teste: one(testes, {
    fields: [metasAlunos.testeId],
    references: [testes.id],
  }),
  definidoPorProfessor: one(professores, {
    fields: [metasAlunos.definidoPor],
    references: [professores.id],
  }),
}));

// Insert schemas
export const insertAlunoSchema = createInsertSchema(alunos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfessorSchema = createInsertSchema(professores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTurmaSchema = createInsertSchema(turmas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatriculaSchema = createInsertSchema(matriculas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPagamentoSchema = createInsertSchema(pagamentos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  valor: z.union([
    z.string().refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, "Valor deve ser um número maior que zero"),
    z.number().positive("Valor deve ser maior que zero").transform(val => val.toString())
  ]),
});

export const insertFilialSchema = createInsertSchema(filiais).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  confirmarSenha: z.string().optional(),
}).refine((data) => {
  if (data.senha && data.confirmarSenha) {
    return data.senha === data.confirmarSenha;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

// New schemas for responsáveis portal
export const insertResponsavelSchema = createInsertSchema(responsaveis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventoSchema = createInsertSchema(eventos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUniformeSchema = createInsertSchema(uniformes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInscricaoEventoSchema = createInsertSchema(inscricoesEventos).omit({
  id: true,
});

export const insertCompraUniformeSchema = createInsertSchema(comprasUniformes).omit({
  id: true,
});

export const insertNotificacaoSchema = createInsertSchema(notificacoes).omit({
  id: true,
});

export const insertPresencaSchema = createInsertSchema(presencas).omit({
  id: true,
  createdAt: true,
});

export const insertPacoteTreinoSchema = createInsertSchema(pacotesTreino).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssinaturaPacoteSchema = createInsertSchema(assinaturasPacotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComboAulasSchema = createInsertSchema(combosAulas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Planos Financeiros schemas
export const insertPlanoFinanceiroSchema = createInsertSchema(planosFinanceiros).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Physical evaluation schemas
export const insertCategoriaTesteSchema = createInsertSchema(categoriasTestes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTesteSchema = createInsertSchema(testes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAvaliacaoFisicaSchema = createInsertSchema(avaliacoesFisicas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResultadoTesteSchema = createInsertSchema(resultadosTestes).omit({
  id: true,
  createdAt: true,
});

export const insertMetaAlunoSchema = createInsertSchema(metasAlunos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Guardian portal schemas - restrict to safe fields only
export const updateAlunoContactSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().max(20).optional(),
  endereco: z.string().optional(),
  bairro: z.string().max(100).optional(),
  cep: z.string().max(10).optional(),
  cidade: z.string().max(100).optional(),
  estado: z.string().max(2).optional(),
  telefoneResponsavel: z.string().max(20).optional(),
  fotoUrl: z.string().optional(),
});

export const guardianInscricaoEventoSchema = z.object({
  alunoId: z.number().int().positive(),
  observacoes: z.string().optional(),
});

export const guardianCompraUniformeSchema = z.object({
  alunoId: z.number().int().positive(),
  tamanho: z.string(),
  cor: z.string(),
  quantidade: z.number().int().positive().default(1),
});

// Unit manager schemas
export const insertGestorUnidadeSchema = createInsertSchema(gestoresUnidade).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ultimoLogin: true,
});

export const loginGestorSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Admin users table for traditional authentication
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  nome: varchar("nome").notNull(),
  email: varchar("email").unique().notNull(),
  senha: varchar("senha").notNull(),
  ativo: boolean("ativo").default(true),
  papel: varchar("papel").default("admin"), // super_admin, admin
  ultimoLogin: timestamp("ultimo_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de convites para admins
export const adminInvites = pgTable("admin_invites", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).unique().notNull(),
  email: varchar("email", { length: 255 }),
  papel: varchar("papel", { length: 50 }).default("admin"), // admin
  criadoPor: integer("criado_por").references(() => adminUsers.id),
  usado: boolean("usado").default(false),
  ativo: boolean("ativo").default(true),
  expiraEm: timestamp("expira_em"), // Null significa que nunca expira
  createdAt: timestamp("created_at").defaultNow(),
});

export type AdminInvite = typeof adminInvites.$inferSelect;
export type InsertAdminInvite = typeof adminInvites.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

// Admin authentication schemas
export const adminLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers, {
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type InsertGestorUnidade = z.infer<typeof insertGestorUnidadeSchema>;
export type GestorUnidade = typeof gestoresUnidade.$inferSelect;
export type GestorUnidadeWithFilial = GestorUnidade & {
  filial: Filial | null;
};

export type InsertAluno = z.infer<typeof insertAlunoSchema>;
export type Aluno = typeof alunos.$inferSelect;
export type AlunoWithFilial = Aluno & {
  filial: Filial | null;
  statusPagamento?: {
    emDia: boolean;
    ultimoPagamento?: string; // mes/ano do último pagamento
    diasAtraso?: number;
  };
};

export type InsertProfessor = z.infer<typeof insertProfessorSchema>;
export type Professor = typeof professores.$inferSelect;
export type ProfessorWithFilial = Professor & {
  filial: Filial | null;
};

export type InsertTurma = z.infer<typeof insertTurmaSchema>;
export type Turma = typeof turmas.$inferSelect;

export type InsertMatricula = z.infer<typeof insertMatriculaSchema>;
export type Matricula = typeof matriculas.$inferSelect;

export type InsertPagamento = z.infer<typeof insertPagamentoSchema>;
export type Pagamento = typeof pagamentos.$inferSelect;

export type InsertPlanoFinanceiro = z.infer<typeof insertPlanoFinanceiroSchema>;
export type PlanoFinanceiro = typeof planosFinanceiros.$inferSelect;
export type PlanoFinanceiroWithFilial = PlanoFinanceiro & {
  filial: Filial | null;
};

export type InsertFilial = z.infer<typeof insertFilialSchema>;
export type Filial = typeof filiais.$inferSelect;

// Combined types for API responses
export type TurmaWithProfessor = Turma & {
  professor: Professor | null;
  filial: Filial | null;
  _count?: {
    matriculas: number;
  };
};

export type AlunoWithTurmas = Aluno & {
  matriculas: (Matricula & {
    turma: Turma & {
      professor: Professor | null;
    };
  })[];
};

export type MatriculaComplete = Matricula & {
  aluno: Aluno;
  turma: TurmaWithProfessor;
};

// New types for responsáveis portal
export type InsertResponsavel = z.infer<typeof insertResponsavelSchema>;
export type Responsavel = typeof responsaveis.$inferSelect;

export type InsertEvento = z.infer<typeof insertEventoSchema>;
export type Evento = typeof eventos.$inferSelect;
export type EventoWithFilial = Evento & {
  filial: Filial | null;
  inscricoes?: InscricaoEvento[];
};

export type InsertUniforme = z.infer<typeof insertUniformeSchema>;
export type Uniforme = typeof uniformes.$inferSelect;

export type InsertInscricaoEvento = z.infer<typeof insertInscricaoEventoSchema>;
export type InscricaoEvento = typeof inscricoesEventos.$inferSelect;

export type InsertCompraUniforme = z.infer<typeof insertCompraUniformeSchema>;
export type CompraUniforme = typeof comprasUniformes.$inferSelect;
export type CompraUniformeComplete = CompraUniforme & {
  uniforme: Uniforme;
  aluno: Aluno;
};

export type InsertNotificacao = z.infer<typeof insertNotificacaoSchema>;
export type Notificacao = typeof notificacoes.$inferSelect;

// Types for responsável portal dashboard
export type ResponsavelWithAlunos = Responsavel & {
  alunos: AlunoWithFilial[];
};

export type InsertPresenca = z.infer<typeof insertPresencaSchema>;
export type Presenca = typeof presencas.$inferSelect;

export type AlunoCompleto = Aluno & {
  responsavel?: Responsavel;
  filial: Filial | null;
  matriculas: (Matricula & {
    turma: TurmaWithProfessor;
  })[];
  pagamentos: Pagamento[];
  inscricoesEventos: (InscricaoEvento & {
    evento: Evento;
  })[];
  comprasUniformes: CompraUniformeComplete[];
  statusPagamento?: {
    emDia: boolean;
    ultimoPagamento?: string;
    diasAtraso?: number;
  };
};

export type InsertPacoteTreino = z.infer<typeof insertPacoteTreinoSchema>;
export type PacoteTreino = typeof pacotesTreino.$inferSelect;

export type InsertAssinaturaPacote = z.infer<typeof insertAssinaturaPacoteSchema>;
export type AssinaturaPacote = typeof assinaturasPacotes.$inferSelect;
export type AssinaturaPacoteComplete = AssinaturaPacote & {
  aluno: Aluno;
  pacote: PacoteTreino;
};

export type InsertComboAulas = z.infer<typeof insertComboAulasSchema>;
export type ComboAulas = typeof combosAulas.$inferSelect;

// Physical evaluation types
export type InsertCategoriaTeste = z.infer<typeof insertCategoriaTesteSchema>;
export type CategoriaTeste = typeof categoriasTestes.$inferSelect;

export type InsertTeste = z.infer<typeof insertTesteSchema>;
export type Teste = typeof testes.$inferSelect;
export type TesteWithCategoria = Teste & {
  categoria: CategoriaTeste;
};

export type InsertAvaliacaoFisica = z.infer<typeof insertAvaliacaoFisicaSchema>;
export type AvaliacaoFisica = typeof avaliacoesFisicas.$inferSelect;
export type AvaliacaoFisicaComplete = AvaliacaoFisica & {
  aluno: Aluno;
  professor: Professor;
  filial: Filial | null;
  resultados: (ResultadoTeste & {
    teste: TesteWithCategoria;
  })[];
};

export type InsertResultadoTeste = z.infer<typeof insertResultadoTesteSchema>;
export type ResultadoTeste = typeof resultadosTestes.$inferSelect;

export type InsertMetaAluno = z.infer<typeof insertMetaAlunoSchema>;
export type MetaAluno = typeof metasAlunos.$inferSelect;
export type MetaAlunoComplete = MetaAluno & {
  aluno: Aluno;
  teste: TesteWithCategoria;
  definidoPorProfessor: Professor | null;
};

// System configuration table for logo and colors
export const configuracoesSistema = pgTable("configuracoes_sistema", {
  id: serial("id").primaryKey(),
  logoUrl: text("logo_url"),
  corPrimaria: varchar("cor_primaria", { length: 7 }).default("#3b82f6"),
  corSecundaria: varchar("cor_secundaria", { length: 7 }).default("#1e40af"),
  corAcento: varchar("cor_acento", { length: 7 }).default("#10b981"),
  corFundo: varchar("cor_fundo", { length: 7 }).default("#f8fafc"),
  corTexto: varchar("cor_texto", { length: 7 }).default("#1e293b"),
  nomeEscola: varchar("nome_escola", { length: 255 }).default("Escola de Futebol"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConfiguracoesSistemaSchema = createInsertSchema(configuracoesSistema, {
  corPrimaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").optional(),
  corSecundaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").optional(),
  corAcento: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").optional(),
  corFundo: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").optional(),
  corTexto: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida").optional(),
  nomeEscola: z.string().min(1, "Nome é obrigatório").optional(),
});

export type InsertConfiguracoesSistema = z.infer<typeof insertConfiguracoesSistemaSchema>;
export type ConfiguracoesSistema = typeof configuracoesSistema.$inferSelect;
