import { storage } from "./storage";

interface SyncData {
  unidadeId: number;
  tipo: 'aluno' | 'professor' | 'pagamento' | 'presenca' | 'avaliacao';
  acao: 'create' | 'update' | 'delete';
  dados: any;
  timestamp: Date;
}

class SyncManager {
  private pendingSyncs: SyncData[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSyncScheduler();
  }

  // Adiciona operação para sincronização
  async addToSync(syncData: SyncData) {
    this.pendingSyncs.push(syncData);
    console.log(`[SYNC] Adicionado para sincronização: ${syncData.tipo} - ${syncData.acao} - Unidade ${syncData.unidadeId}`);
    
    // Sincronização imediata para operações críticas
    if (syncData.tipo === 'pagamento') {
      await this.processSyncBatch();
    }
  }

  // Processa todas as sincronizações pendentes
  async processSyncBatch() {
    if (this.pendingSyncs.length === 0) return;

    console.log(`[SYNC] Processando ${this.pendingSyncs.length} sincronizações pendentes`);

    const syncsToProcess = [...this.pendingSyncs];
    this.pendingSyncs = [];

    for (const sync of syncsToProcess) {
      try {
        await this.processSync(sync);
        console.log(`[SYNC] Sucesso: ${sync.tipo} - ${sync.acao} - Unidade ${sync.unidadeId}`);
      } catch (error) {
        console.error(`[SYNC] Erro ao sincronizar: ${sync.tipo} - ${sync.acao}`, error);
        // Re-adiciona à fila em caso de erro
        this.pendingSyncs.push(sync);
      }
    }
  }

  // Processa uma sincronização individual
  private async processSync(sync: SyncData) {
    const { unidadeId, tipo, acao, dados } = sync;

    switch (tipo) {
      case 'aluno':
        await this.syncAluno(acao, dados, unidadeId);
        break;
      case 'professor':
        await this.syncProfessor(acao, dados, unidadeId);
        break;
      case 'pagamento':
        await this.syncPagamento(acao, dados, unidadeId);
        break;
      case 'presenca':
        await this.syncPresenca(acao, dados, unidadeId);
        break;
      case 'avaliacao':
        await this.syncAvaliacao(acao, dados, unidadeId);
        break;
    }
  }

  private async syncAluno(acao: string, dados: any, unidadeId: number) {
    // Garantir que o aluno pertence à unidade correta
    const alunoData = { ...dados, filialId: unidadeId };
    
    switch (acao) {
      case 'create':
        await storage.createAluno(alunoData);
        break;
      case 'update':
        await storage.updateAluno(dados.id, alunoData);
        break;
      case 'delete':
        await storage.deleteAluno(dados.id);
        break;
    }
  }

  private async syncProfessor(acao: string, dados: any, unidadeId: number) {
    const professorData = { ...dados, filialId: unidadeId };
    
    switch (acao) {
      case 'create':
        await storage.createProfessor(professorData);
        break;
      case 'update':
        await storage.updateProfessor(dados.id, professorData);
        break;
      case 'delete':
        await storage.deleteProfessor(dados.id);
        break;
    }
  }

  private async syncPagamento(acao: string, dados: any, unidadeId: number) {
    switch (acao) {
      case 'create':
        await storage.createPagamento(dados);
        break;
      case 'delete':
        await storage.deletePagamento(dados.id);
        break;
    }
  }

  private async syncPresenca(acao: string, dados: any, unidadeId: number) {
    switch (acao) {
      case 'create':
        // Registra presenças em lote
        await storage.registrarPresencas(Array.isArray(dados) ? dados : [dados]);
        break;
    }
  }

  private async syncAvaliacao(acao: string, dados: any, unidadeId: number) {
    switch (acao) {
      case 'create':
        await storage.createAvaliacaoFisica(dados);
        break;
      case 'update':
        await storage.updateAvaliacaoFisica(dados.id, dados);
        break;
      case 'delete':
        await storage.deleteAvaliacaoFisica(dados.id);
        break;
    }
  }

  // Inicia o agendador de sincronização
  private startSyncScheduler() {
    // Sincronização a cada 30 segundos
    this.syncInterval = setInterval(async () => {
      await this.processSyncBatch();
    }, 30000);
  }

  // Para o agendador
  stopSyncScheduler() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Obtém estatísticas de sincronização
  getSyncStats() {
    return {
      pendingSyncs: this.pendingSyncs.length,
      isActive: this.syncInterval !== null
    };
  }

  // Força sincronização imediata
  async forceSyncNow() {
    await this.processSyncBatch();
  }
}

export const syncManager = new SyncManager();

// Função helper para adicionar sincronização
export async function addToSync(
  unidadeId: number,
  tipo: 'aluno' | 'professor' | 'pagamento' | 'presenca' | 'avaliacao',
  acao: 'create' | 'update' | 'delete',
  dados: any
) {
  await syncManager.addToSync({
    unidadeId,
    tipo,
    acao,
    dados,
    timestamp: new Date()
  });
}