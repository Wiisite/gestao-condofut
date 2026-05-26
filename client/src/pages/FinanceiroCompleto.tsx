import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  ShoppingBag, 
  Users,
  TrendingUp,
  TrendingDown,
  FileText,
  Search,
  Filter,
  Bell,
  AlertTriangle,
  CheckCircle,
  Package,
  X,
  Eye
} from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { 
  Pagamento, 
  AlunoWithFilial, 
  Evento, 
  Uniforme, 
  CompraUniforme,
  InscricaoEvento,
  InsertPagamento,
  InsertEvento,
  InsertUniforme,
  InsertCompraUniforme,
  InsertInscricaoEvento,
  PlanoFinanceiroWithFilial,
  InsertPlanoFinanceiro,
  Filial
} from "@shared/schema";

export default function FinanceiroCompleto() {
  const [activeTab, setActiveTab] = useState("pagamentos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"pagamento" | "evento" | "uniforme" | "compra-uniforme" | "inscricao-evento">("pagamento");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estado do formulário de pagamento
  const [pagamentoForm, setPagamentoForm] = useState({
    alunoId: 0,
    valor: "",
    mesReferencia: "",
    dataPagamento: new Date().toISOString().split('T')[0],
    formaPagamento: "",
    observacoes: "",
  });
  const [editingPagamentoId, setEditingPagamentoId] = useState<number | null>(null);
  const [deletingPagamentoId, setDeletingPagamentoId] = useState<number | null>(null);
  
  // Estado para extrato e pagamento em lote
  const [selectedAlunoExtrato, setSelectedAlunoExtrato] = useState<number | null>(null);
  const [mesesSelecionados, setMesesSelecionados] = useState<string[]>([]);
  const [showLoteDialog, setShowLoteDialog] = useState(false);
  const [lotePagamentoForm, setLotePagamentoForm] = useState({
    valorMensal: "",
    formaPagamento: "",
    dataPagamento: new Date().toISOString().split('T')[0],
  });

  // Estado para planos financeiros
  const [showPlanoDialog, setShowPlanoDialog] = useState(false);
  const [editingPlanoId, setEditingPlanoId] = useState<number | null>(null);
  const [planoForm, setPlanoForm] = useState({
    nome: "",
    descricao: "",
    valorMensal: "",
    quantidadeMeses: "1",
    descontoPercentual: "0",
    diaVencimento: "10",
    taxaMatricula: "0",
    filialId: null as number | null,
  });

  // Estado para notificações
  const [showNotificacaoDialog, setShowNotificacaoDialog] = useState(false);
  const [notificacaoForm, setNotificacaoForm] = useState({
    titulo: "",
    mensagem: "",
    tipo: "geral",
    destinatario: "todos",
  });

  // Estado para inscrição em evento
  const [inscricaoEventoForm, setInscricaoEventoForm] = useState({
    alunoId: 0,
    eventoId: 0,
    statusPagamento: "pendente",
    statusConfirmacao: "inscrito",
    observacoes: "",
  });

  // Estado para uniformes
  const [editingUniformeId, setEditingUniformeId] = useState<number | null>(null);
  const [uniformeForm, setUniformeForm] = useState({
    nome: "",
    categoria: "camisa",
    descricao: "",
    preco: "",
    tamanhos: "",
    cores: "",
    estoque: "0",
    imagemUrl: "",
  });
  const [isCriandoNovaCategoria, setIsCriandoNovaCategoria] = useState(false);

  // Queries
  const { data: pagamentos = [] } = useQuery<Pagamento[]>({
    queryKey: ["/api/pagamentos"],
  });

  const { data: alunos = [] } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/alunos"],
  });

  const { data: eventos = [] } = useQuery<Evento[]>({
    queryKey: ["/api/eventos"],
  });

  const { data: uniformes = [] } = useQuery<Uniforme[]>({
    queryKey: ["/api/uniformes"],
  });

  const { data: comprasUniformes = [] } = useQuery<CompraUniforme[]>({
    queryKey: ["/api/compras-uniformes"],
  });

  const { data: inscricoesEventos = [] } = useQuery<InscricaoEvento[]>({
    queryKey: ["/api/inscricoes-eventos"],
  });

  const { data: pacotesTreino = [] } = useQuery<any[]>({
    queryKey: ["/api/pacotes-treino"],
  });

  const { data: assinaturasPacotes = [] } = useQuery<any[]>({
    queryKey: ["/api/assinaturas-pacotes"],
  });

  // Mutations
  const createPagamentoMutation = useMutation({
    mutationFn: async (data: InsertPagamento) => {
      return await apiRequest("POST", "/api/pagamentos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pagamentos"] });
      setDialogOpen(false);
      setPagamentoForm({
        alunoId: 0,
        valor: "",
        mesReferencia: "",
        dataPagamento: new Date().toISOString().split('T')[0],
        formaPagamento: "",
        observacoes: "",
      });
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const updatePagamentoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPagamento> }) => {
      return await apiRequest("PUT", `/api/pagamentos/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pagamentos"] });
      setDialogOpen(false);
      setEditingPagamentoId(null);
      setPagamentoForm({
        alunoId: 0,
        valor: "",
        mesReferencia: "",
        dataPagamento: new Date().toISOString().split('T')[0],
        formaPagamento: "",
        observacoes: "",
      });
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const deletePagamentoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/pagamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pagamentos"] });
      setDeletingPagamentoId(null);
      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir pagamento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleEditPagamento = (pagamento: Pagamento) => {
    setEditingPagamentoId(pagamento.id);
    setPagamentoForm({
      alunoId: pagamento.alunoId || 0,
      valor: pagamento.valor || "",
      mesReferencia: pagamento.mesReferencia || "",
      dataPagamento: pagamento.dataPagamento || new Date().toISOString().split('T')[0],
      formaPagamento: pagamento.formaPagamento || "",
      observacoes: pagamento.observacoes || "",
    });
    setDialogType("pagamento");
    setDialogOpen(true);
  };

  // Mutation para pagamento em lote
  const createPagamentoLoteMutation = useMutation({
    mutationFn: async (pagamentos: InsertPagamento[]) => {
      const results = [];
      for (const pagamento of pagamentos) {
        const result = await apiRequest("POST", "/api/pagamentos", pagamento);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pagamentos"] });
      setShowLoteDialog(false);
      setMesesSelecionados([]);
      setLotePagamentoForm({
        valorMensal: "",
        formaPagamento: "",
        dataPagamento: new Date().toISOString().split('T')[0],
      });
      toast({
        title: "Sucesso",
        description: `${mesesSelecionados.length} pagamentos registrados com sucesso!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar pagamentos",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  // Gerar lista de meses para seleção (desde a data de matrícula até o mês atual + 12)
  const gerarMesesDisponiveis = () => {
    const meses = [];
    const hoje = new Date();
    const alunoSelecionado = alunos.find(a => a.id === selectedAlunoExtrato);
    
    // Usar data de matrícula do aluno ou 12 meses atrás se não tiver
    let dataInicio: Date;
    if (alunoSelecionado?.dataMatricula) {
      dataInicio = new Date(alunoSelecionado.dataMatricula);
    } else {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 12, 1);
    }
    
    // Gerar meses desde a data de matrícula até 12 meses no futuro
    const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 12, 1);
    
    let dataAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
    while (dataAtual <= dataFim) {
      const mesRef = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`;
      const mesNome = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      meses.push({ value: mesRef, label: mesNome });
      dataAtual = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1);
    }
    
    return meses;
  };

  const mesesDisponiveis = gerarMesesDisponiveis();

  // Filtrar pagamentos do aluno selecionado
  const pagamentosDoAluno = selectedAlunoExtrato 
    ? pagamentos.filter(p => p.alunoId === selectedAlunoExtrato)
    : [];

  // Verificar quais meses já foram pagos
  const mesesPagos = pagamentosDoAluno.map(p => p.mesReferencia);

  // Query para planos financeiros
  const { data: planosFinanceiros = [] } = useQuery<PlanoFinanceiroWithFilial[]>({
    queryKey: ["/api/planos-financeiros"],
    queryFn: async () => {
      const res = await fetch("/api/planos-financeiros", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch planos");
      return res.json();
    },
  });

  // Query para filiais
  const { data: filiaisData = [] } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
    queryFn: async () => {
      const res = await fetch("/api/filiais", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch filiais");
      return res.json();
    },
  });

  // Query para notificações enviadas
  const { data: notificacoesEnviadas = [] } = useQuery<any[]>({
    queryKey: ["/api/notificacoes"],
    queryFn: async () => {
      const res = await fetch("/api/notificacoes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notificacoes");
      return res.json();
    },
  });

  // Mutations para planos financeiros
  const createPlanoMutation = useMutation({
    mutationFn: async (data: InsertPlanoFinanceiro) => {
      return await apiRequest("POST", "/api/planos-financeiros", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planos-financeiros"] });
      setShowPlanoDialog(false);
      resetPlanoForm();
      toast({
        title: "Sucesso",
        description: "Plano financeiro criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const updatePlanoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPlanoFinanceiro> }) => {
      return await apiRequest("PUT", `/api/planos-financeiros/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planos-financeiros"] });
      setShowPlanoDialog(false);
      setEditingPlanoId(null);
      resetPlanoForm();
      toast({
        title: "Sucesso",
        description: "Plano financeiro atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const deletePlanoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/planos-financeiros/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planos-financeiros"] });
      toast({
        title: "Sucesso",
        description: "Plano financeiro excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir plano",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const resetPlanoForm = () => {
    setPlanoForm({
      nome: "",
      descricao: "",
      valorMensal: "",
      quantidadeMeses: "1",
      descontoPercentual: "0",
      diaVencimento: "10",
      taxaMatricula: "0",
      filialId: null,
    });
  };

  const handleEditPlano = (plano: PlanoFinanceiroWithFilial) => {
    setEditingPlanoId(plano.id);
    setPlanoForm({
      nome: plano.nome,
      descricao: plano.descricao || "",
      valorMensal: plano.valorMensal || "",
      quantidadeMeses: String(plano.quantidadeMeses || 1),
      descontoPercentual: plano.descontoPercentual || "0",
      diaVencimento: String(plano.diaVencimento || 10),
      taxaMatricula: plano.taxaMatricula || "0",
      filialId: plano.filialId,
    });
    setShowPlanoDialog(true);
  };

  const handleSavePlano = () => {
    const valorMensal = parseFloat(planoForm.valorMensal);
    const quantidadeMeses = parseInt(planoForm.quantidadeMeses);
    const descontoPercentual = parseFloat(planoForm.descontoPercentual || "0");
    const valorTotal = valorMensal * quantidadeMeses * (1 - descontoPercentual / 100);

    const planoData: InsertPlanoFinanceiro = {
      nome: planoForm.nome,
      descricao: planoForm.descricao || null,
      valorMensal: planoForm.valorMensal,
      quantidadeMeses: quantidadeMeses,
      descontoPercentual: planoForm.descontoPercentual,
      valorTotal: valorTotal.toFixed(2),
      diaVencimento: parseInt(planoForm.diaVencimento),
      taxaMatricula: planoForm.taxaMatricula,
      filialId: planoForm.filialId,
    };

    if (editingPlanoId) {
      updatePlanoMutation.mutate({ id: editingPlanoId, data: planoData });
    } else {
      createPlanoMutation.mutate(planoData);
    }
  };

  const handleEditUniforme = (uniforme: any) => {
    setEditingUniformeId(uniforme.id);
    
    // Função auxiliar para converter JSON ou string simples para o formato do input (vírgula)
    const formatValue = (val: any) => {
      if (!val) return "";
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.join(", ");
        return String(val);
      } catch (e) {
        return String(val);
      }
    };

    setUniformeForm({
      nome: uniforme.nome,
      categoria: uniforme.categoria || "camisa",
      descricao: uniforme.descricao || "",
      preco: uniforme.preco || "",
      tamanhos: formatValue(uniforme.tamanhos),
      cores: formatValue(uniforme.cores),
      estoque: String(uniforme.estoque || 0),
      imagemUrl: uniforme.imagemUrl || "",
    });
    const categoriasPadrao = ["camisa", "short", "meias", "chuteira", "acessorios"];
    const isPersonalizada = !categoriasPadrao.includes(uniforme.categoria);
    setIsCriandoNovaCategoria(isPersonalizada);
    setDialogType("uniforme");
    setDialogOpen(true);
  };

  const handleSaveUniforme = () => {
    if (!uniformeForm.nome || !uniformeForm.preco) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e preço são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const uniformeData = {
      nome: uniformeForm.nome,
      categoria: uniformeForm.categoria,
      descricao: uniformeForm.descricao || null,
      preco: String(uniformeForm.preco).replace(',', '.'),
      tamanhos: JSON.stringify(String(uniformeForm.tamanhos).split(',').map(s => s.trim()).filter(s => s !== "")),
      cores: JSON.stringify(String(uniformeForm.cores).split(',').map(s => s.trim()).filter(s => s !== "")),
      estoque: parseInt(String(uniformeForm.estoque)) || 0,
      imagemUrl: uniformeForm.imagemUrl || null,
    };

    console.log("Salvando uniforme:", uniformeData);

    if (editingUniformeId) {
      updateUniformeMutation.mutate({ id: editingUniformeId, data: uniformeData });
    } else {
      createUniformeMutation.mutate(uniformeData as InsertUniforme);
    }
  };

  const handleCreateEvento = () => {
    const nome = (document.getElementById("nomeEvento") as HTMLInputElement)?.value;
    const data = (document.getElementById("dataEvento") as HTMLInputElement)?.value;
    const descricao = (document.getElementById("descricaoEvento") as HTMLTextAreaElement)?.value;
    const local = (document.getElementById("localEvento") as HTMLInputElement)?.value;
    const preco = (document.getElementById("precoEvento") as HTMLInputElement)?.value;
    const vagas = (document.getElementById("vagasEvento") as HTMLInputElement)?.value;
    const hora = (document.getElementById("horaInicio") as HTMLInputElement)?.value;

    if (!nome || !data || !preco) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, data e preço do evento",
        variant: "destructive",
      });
      return;
    }

    createEventoMutation.mutate({
      nome,
      dataEvento: data,
      descricao: descricao || null,
      local: local || null,
      preco: preco,
      vagasMaximas: parseInt(vagas) || 50,
      horaInicio: hora || null,
      ativo: true,
    });
  };

  const createEventoMutation = useMutation({
    mutationFn: async (data: InsertEvento) => {
      return await apiRequest("POST", "/api/eventos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eventos"] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!",
      });
    },
  });

  const createUniformeMutation = useMutation({
    mutationFn: async (data: InsertUniforme) => {
      return await apiRequest("POST", "/api/uniformes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uniformes"] });
      setDialogOpen(false);
      setEditingUniformeId(null);
      toast({
        title: "Sucesso",
        description: "Uniforme adicionado com sucesso!",
      });
    },
  });

  const updateUniformeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertUniforme> }) => {
      return await apiRequest("PUT", `/api/uniformes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uniformes"] });
      setDialogOpen(false);
      setEditingUniformeId(null);
      toast({
        title: "Sucesso",
        description: "Uniforme atualizado com sucesso!",
      });
    },
  });

  const deleteUniformeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/uniformes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uniformes"] });
      toast({
        title: "Sucesso",
        description: "Uniforme removido com sucesso!",
      });
    },
  });

  const comprarUniformeMutation = useMutation({
    mutationFn: async (data: InsertCompraUniforme) => {
      return await apiRequest("POST", "/api/compras-uniformes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compras-uniformes"] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Compra de uniforme registrada!",
      });
    },
  });

  const inscreverEventoMutation = useMutation({
    mutationFn: async (data: InsertInscricaoEvento) => {
      return await apiRequest("POST", "/api/inscricoes-eventos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inscricoes-eventos"] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Inscrição em evento realizada!",
      });
    },
  });

  const confirmarPagamentoEventoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/inscricoes-eventos/${id}`, { statusPagamento: "pago" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inscricoes-eventos"] });
      toast({
        title: "Pagamento confirmado",
        description: "A inscrição foi marcada como paga.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível confirmar o pagamento.",
        variant: "destructive",
      });
    },
  });

  const confirmarPresencaEventoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/inscricoes-eventos/${id}`, { statusConfirmacao: "confirmado" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inscricoes-eventos"] });
      toast({
        title: "Presença confirmada",
        description: "A baixa do aluno no evento foi realizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível confirmar a presença.",
        variant: "destructive",
      });
    },
  });

  // Cálculos financeiros
  const totalPagamentos = pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || "0"), 0);
  const totalUniformes = comprasUniformes.reduce((sum, c) => sum + parseFloat(c.preco || "0") * (c.quantidade || 1), 0);
  const totalEventos = inscricoesEventos.length * 50; // Valor médio por evento
  const receitaTotal = totalPagamentos + totalUniformes + totalEventos;

  const openDialog = (type: typeof dialogType, eventoId?: number) => {
    if (type === "uniforme") {
      setEditingUniformeId(null);
      setUniformeForm({
        nome: "",
        categoria: "camisa",
        descricao: "",
        preco: "",
        tamanhos: "",
        cores: "",
        estoque: "0",
        imagemUrl: "",
      });
      setIsCriandoNovaCategoria(false);
    }
    if (type === "inscricao-evento") {
      setInscricaoEventoForm({
        alunoId: 0,
        eventoId: eventoId || 0,
        statusPagamento: "pendente",
        statusConfirmacao: "inscrito",
        observacoes: "",
      });
    }
    setDialogType(type);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Área Financeira Completa</h1>
          <p className="text-muted-foreground">
            Gestão de pagamentos, uniformes e eventos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openDialog("pagamento")} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Pagamento
          </Button>
          <Button onClick={() => openDialog("evento")} variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Novo Evento
          </Button>
          <Button onClick={() => openDialog("uniforme")} variant="outline" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Novo Uniforme
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 bg-green-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mensalidades</p>
                <p className="text-2xl font-bold">R$ {totalPagamentos.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-blue-600 bg-blue-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uniformes</p>
                <p className="text-2xl font-bold">R$ {totalUniformes.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600 bg-purple-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eventos</p>
                <p className="text-2xl font-bold">R$ {totalEventos.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-emerald-600 bg-emerald-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold">R$ {receitaTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="extrato">Extrato Aluno</TabsTrigger>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="uniformes">Uniformes</TabsTrigger>
          <TabsTrigger value="compras-uniformes">Compras</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
          <TabsTrigger value="pacotes">Pacotes</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
        </TabsList>

        {/* Tab de Pagamentos */}
        <TabsContent value="pagamentos" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar pagamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => openDialog("pagamento")} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Pagamento
            </Button>
          </div>

          <div className="grid gap-4">
            {pagamentos.map((pagamento) => {
              const aluno = alunos.find(a => a.id === pagamento.alunoId);
              return (
                <Card key={pagamento.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{aluno?.nome || "Aluno não encontrado"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pagamento.mesReferencia} • {pagamento.formaPagamento}
                        </p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-xl font-bold text-green-600">
                          R$ {parseFloat(pagamento.valor || "0").toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditPagamento(pagamento)}
                          title="Editar pagamento"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Excluir pagamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Pagamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este pagamento de <strong>R$ {parseFloat(pagamento.valor || "0").toFixed(2)}</strong> do aluno <strong>{aluno?.nome}</strong>?
                                <br /><br />
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePagamentoMutation.mutate(pagamento.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab de Extrato do Aluno */}
        <TabsContent value="extrato" className="space-y-6">
          {/* Seleção de Aluno */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Extrato de Pagamentos do Aluno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Selecione o Aluno</Label>
                <Select 
                  value={selectedAlunoExtrato?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedAlunoExtrato(parseInt(value));
                    setMesesSelecionados([]);
                  }}
                >
                  <SelectTrigger className="h-12 max-w-md">
                    <SelectValue placeholder="Escolha um aluno para ver o extrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos.map((aluno) => (
                      <SelectItem key={aluno.id} value={aluno.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{aluno.nome}</span>
                          {aluno.filial && <Badge variant="outline" className="text-xs">{aluno.filial.nome}</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Extrato do Aluno Selecionado */}
          {selectedAlunoExtrato && (
            <>
              {/* Dados do Aluno */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    Dados do Aluno
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome Completo</p>
                      <p className="font-semibold text-lg">{alunos.find(a => a.id === selectedAlunoExtrato)?.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unidade</p>
                      <p className="font-semibold">{alunos.find(a => a.id === selectedAlunoExtrato)?.filial?.nome || "Não definida"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status de Pagamento</p>
                      {(() => {
                        const mesAtual = new Date().toISOString().slice(0, 7);
                        const pagouMesAtual = mesesPagos.includes(mesAtual);
                        return pagouMesAtual ? (
                          <Badge className="bg-green-600">Em dia</Badge>
                        ) : (
                          <Badge className="bg-orange-500">Atrasado</Badge>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo em Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      R$ {pagamentosDoAluno.reduce((sum, p) => sum + parseFloat(p.valor || "0"), 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-700">Total Pago</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{pagamentosDoAluno.length}</p>
                    <p className="text-sm text-blue-700">Pagamentos</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600 capitalize">
                      {pagamentosDoAluno.length > 0 
                        ? new Date(pagamentosDoAluno[0].mesReferencia + "-01").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                        : "-"
                      }
                    </p>
                    <p className="text-sm text-purple-700">Último Mês</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      R$ {pagamentosDoAluno.length > 0 ? parseFloat(pagamentosDoAluno[0].valor || "0").toFixed(2) : "0.00"}
                    </p>
                    <p className="text-sm text-orange-700">Mensalidade</p>
                  </CardContent>
                </Card>
              </div>

              {/* Mensalidades Recorrentes - Dar Baixa */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5" />
                      Mensalidades - Dar Baixa
                    </CardTitle>
                    {mesesSelecionados.length > 0 && (
                      <Button 
                        onClick={() => setShowLoteDialog(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Dar Baixa em {mesesSelecionados.length} Mês(es)
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Tabela de Mensalidades */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-12">
                            <input 
                              type="checkbox"
                              className="w-4 h-4 rounded"
                              checked={mesesSelecionados.length === mesesDisponiveis.filter(m => !mesesPagos.includes(m.value)).length && mesesSelecionados.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const mesesNaoPagos = mesesDisponiveis.filter(m => !mesesPagos.includes(m.value));
                                  setMesesSelecionados(mesesNaoPagos.map(m => m.value));
                                } else {
                                  setMesesSelecionados([]);
                                }
                              }}
                            />
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mês Referência</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data Pagamento</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Forma</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mesesDisponiveis.map((mes) => {
                          const jaPago = mesesPagos.includes(mes.value);
                          const pagamento = pagamentosDoAluno.find(p => p.mesReferencia === mes.value);
                          const selecionado = mesesSelecionados.includes(mes.value);
                          const mesAtual = new Date().toISOString().slice(0, 7);
                          const isAtrasado = !jaPago && mes.value < mesAtual;
                          
                          return (
                            <tr key={mes.value} className={`border-b hover:bg-gray-50 ${selecionado ? 'bg-blue-50' : ''}`}>
                              <td className="py-3 px-4">
                                {!jaPago && (
                                  <input 
                                    type="checkbox"
                                    className="w-4 h-4 rounded"
                                    checked={selecionado}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setMesesSelecionados(prev => [...prev, mes.value]);
                                      } else {
                                        setMesesSelecionados(prev => prev.filter(m => m !== mes.value));
                                      }
                                    }}
                                  />
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium capitalize">{mes.label}</p>
                                <p className="text-xs text-muted-foreground">{mes.value}</p>
                              </td>
                              <td className="py-3 px-4">
                                {jaPago ? (
                                  <Badge className="bg-green-600">Pago</Badge>
                                ) : isAtrasado ? (
                                  <Badge className="bg-red-500">Atrasado</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600 border-orange-300">Pendente</Badge>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {jaPago ? (
                                  <span className="text-green-600 font-semibold">
                                    R$ {parseFloat(pagamento?.valor || "0").toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {jaPago && pagamento ? (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    {new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR')}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {jaPago && pagamento ? (
                                  <Badge variant="outline">{pagamento.formaPagamento}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {!jaPago ? (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      setMesesSelecionados([mes.value]);
                                      setShowLoteDialog(true);
                                    }}
                                  >
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    Dar Baixa
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditPagamento(pagamento!)}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Editar
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Resumo da Seleção */}
                  {mesesSelecionados.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-800 font-semibold text-lg">
                            {mesesSelecionados.length} mensalidade(s) selecionada(s)
                          </p>
                          <p className="text-blue-600 text-sm">
                            Clique em "Dar Baixa" para registrar o pagamento
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => setMesesSelecionados([])}
                          >
                            Limpar
                          </Button>
                          <Button 
                            onClick={() => setShowLoteDialog(true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Dar Baixa
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Pagamentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    Histórico de Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pagamentosDoAluno.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum pagamento registrado para este aluno
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mês Referência</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data Pagamento</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Forma</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Observações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagamentosDoAluno.map((pagamento) => (
                            <tr key={pagamento.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <p className="font-medium capitalize">
                                  {new Date(pagamento.mesReferencia + "-01").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-muted-foreground">{pagamento.mesReferencia}</p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  {new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR')}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-green-600 font-semibold">
                                  R$ {parseFloat(pagamento.valor || "0").toFixed(2)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline">{pagamento.formaPagamento}</Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {pagamento.observacoes || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!selectedAlunoExtrato && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Selecione um Aluno</h3>
                <p className="text-muted-foreground">
                  Escolha um aluno acima para visualizar o extrato e dar baixa nas mensalidades
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab de Planos Financeiros */}
        <TabsContent value="planos" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Planos Financeiros</h2>
              <p className="text-sm text-muted-foreground">Gerencie os planos de mensalidades disponíveis</p>
            </div>
            <Button 
              onClick={() => {
                resetPlanoForm();
                setEditingPlanoId(null);
                setShowPlanoDialog(true);
              }} 
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Plano
            </Button>
          </div>

          {/* Lista de Planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planosFinanceiros.map((plano) => {
              const valorMensal = parseFloat(plano.valorMensal || "0");
              const valorTotal = parseFloat(plano.valorTotal || "0");
              const desconto = parseFloat(plano.descontoPercentual || "0");
              
              return (
                <Card key={plano.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plano.nome}</CardTitle>
                      {desconto > 0 && (
                        <Badge className="bg-green-600">{desconto}% OFF</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{plano.descricao || "Sem descrição"}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Valor Mensal:</span>
                        <span className="font-semibold text-blue-600">R$ {valorMensal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Duração:</span>
                        <span className="font-medium">{plano.quantidadeMeses} {plano.quantidadeMeses === 1 ? 'mês' : 'meses'}</span>
                      </div>
                      {plano.quantidadeMeses > 1 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Valor Total:</span>
                          <span className="font-bold text-green-600">R$ {valorTotal.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Vencimento:</span>
                        <span className="font-medium">Dia {plano.diaVencimento}</span>
                      </div>
                      {parseFloat(plano.taxaMatricula || "0") > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Taxa Matrícula:</span>
                          <span className="font-medium">R$ {parseFloat(plano.taxaMatricula || "0").toFixed(2)}</span>
                        </div>
                      )}
                      {plano.filial && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Unidade:</span>
                          <Badge variant="outline">{plano.filial.nome}</Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditPlano(plano)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o plano "{plano.nome}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deletePlanoMutation.mutate(plano.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {planosFinanceiros.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum Plano Cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie planos financeiros para definir valores de mensalidades e descontos
                </p>
                <Button onClick={() => setShowPlanoDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Plano
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab de Uniformes */}
        <TabsContent value="uniformes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Catálogo de Uniformes</h2>
            <Button onClick={() => openDialog("uniforme")} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Uniforme
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniformes.map((uniforme) => (
              <Card key={uniforme.id} className="overflow-hidden">
                <div className="w-full h-72 bg-muted/20 flex items-center justify-center overflow-hidden border-b">
                  {uniforme.imagemUrl ? (
                    <img 
                      src={uniforme.imagemUrl} 
                      alt={uniforme.nome}
                      className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Sem+Imagem';
                      }}
                    />
                  ) : (
                    <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{uniforme.nome}</h3>
                    <p className="text-sm text-muted-foreground">{uniforme.descricao}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{uniforme.tamanhos}</Badge>
                      <p className="text-lg font-bold text-blue-600">
                        R$ {parseFloat(uniforme.preco || "0").toFixed(2)}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cores: {uniforme.cores} • Estoque: {uniforme.estoque}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => handleEditUniforme(uniforme)} 
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Uniforme</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja realmente excluir "{uniforme.nome}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteUniformeMutation.mutate(uniforme.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Button 
                      onClick={() => openDialog("compra-uniforme")} 
                      className="w-full"
                      variant="secondary"
                      size="sm"
                    >
                      Registrar Venda
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab de Compras de Uniformes */}
        <TabsContent value="compras-uniformes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pedidos de Uniformes</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                {comprasUniformes.filter(c => c.statusPagamento === "pendente").length} Pendentes
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-300">
                {comprasUniformes.filter(c => c.statusPagamento === "pago").length} Pagos
              </Badge>
            </div>
          </div>
          
          {comprasUniformes.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum pedido de uniforme ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comprasUniformes.map((compra) => {
                const aluno = alunos.find(a => a.id === compra.alunoId);
                const uniforme = uniformes.find(u => u.id === compra.uniformeId);
                return (
                  <Card key={compra.id} className={compra.statusPagamento === "pendente" ? "border-orange-200 bg-orange-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          {uniforme?.imagemUrl ? (
                            <img src={uniforme.imagemUrl} alt={uniforme.nome} className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{aluno?.nome || "Aluno não encontrado"}</h3>
                            <p className="text-sm text-muted-foreground">
                              {uniforme?.nome} • Tam: {compra.tamanho} • Cor: {compra.cor}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Quantidade: {compra.quantidade} • Data: {compra.dataCompra ? new Date(compra.dataCompra).toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-xl font-bold text-green-600">
                            R$ {(parseFloat(compra.preco || "0") * (compra.quantidade || 1)).toFixed(2)}
                          </p>
                          <div className="flex gap-2 justify-end">
                            <Badge variant={compra.statusPagamento === "pago" ? "default" : "secondary"} className={compra.statusPagamento === "pendente" ? "bg-orange-500" : "bg-green-500"}>
                              {compra.statusPagamento === "pago" ? "✓ Pago" : "⏳ Pendente"}
                            </Badge>
                            <Badge variant={compra.statusEntrega === "entregue" ? "default" : "outline"}>
                              {compra.statusEntrega === "entregue" ? "✓ Entregue" : "📦 Preparando"}
                            </Badge>
                          </div>
                          {compra.statusPagamento === "pendente" && (
                            <div className="flex gap-2 justify-end mt-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={async () => {
                                  try {
                                    await apiRequest("PUT", `/api/compras-uniformes/${compra.id}`, { statusPagamento: "pago" });
                                    queryClient.invalidateQueries({ queryKey: ["/api/compras-uniformes"] });
                                    toast({ title: "Sucesso", description: "Pagamento confirmado!" });
                                  } catch (error) {
                                    toast({ title: "Erro", description: "Erro ao confirmar pagamento", variant: "destructive" });
                                  }
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirmar Pagamento
                              </Button>
                            </div>
                          )}
                          {compra.statusPagamento === "pago" && compra.statusEntrega !== "entregue" && (
                            <div className="flex gap-2 justify-end mt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    await apiRequest("PUT", `/api/compras-uniformes/${compra.id}`, { statusEntrega: "entregue" });
                                    queryClient.invalidateQueries({ queryKey: ["/api/compras-uniformes"] });
                                    toast({ title: "Sucesso", description: "Entrega confirmada!" });
                                  } catch (error) {
                                    toast({ title: "Erro", description: "Erro ao confirmar entrega", variant: "destructive" });
                                  }
                                }}
                              >
                                <Package className="w-4 h-4 mr-1" />
                                Marcar Entregue
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab de Eventos */}
        <TabsContent value="eventos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Eventos Disponíveis</h2>
            <Button onClick={() => openDialog("evento")} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar Evento
            </Button>
          </div>

          <div className="grid gap-4">
            {eventos.map((evento) => (
              <Card key={evento.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{evento.nome}</h3>
                      <p className="text-sm text-muted-foreground">{evento.descricao}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(evento.dataEvento).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">
                            {evento.vagasMaximas} vagas
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600">
                        R$ {parseFloat(evento.preco || "0").toFixed(2)}
                      </p>
                      <Button 
                        onClick={() => openDialog("inscricao-evento", evento.id)} 
                        size="sm"
                        className="mt-2"
                      >
                        Inscrever Aluno
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab de Inscrições */}
        <TabsContent value="inscricoes" className="space-y-4">
          <h2 className="text-xl font-semibold">Inscrições em Eventos</h2>
          <div className="grid gap-4">
            {inscricoesEventos.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma inscrição em evento ainda.</p>
                </CardContent>
              </Card>
            )}
            {inscricoesEventos.map((inscricao) => {
              const aluno = alunos.find(a => a.id === inscricao.alunoId);
              const evento = eventos.find(e => e.id === inscricao.eventoId);
              const isPago = inscricao.statusPagamento === "pago";
              const isConfirmado = (inscricao as any).statusConfirmacao === "confirmado";
              return (
                <Card key={inscricao.id} className={isConfirmado ? "border-green-300 bg-green-50/30" : ""}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{aluno?.nome || "Aluno não encontrado"}</h3>
                          {aluno?.filial && (
                            <Badge variant="outline" className="text-xs">
                              {aluno.filial.nome}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="font-medium">Evento:</span> {evento?.nome || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Inscrito em {inscricao.dataInscricao ? new Date(inscricao.dataInscricao).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2 min-w-[200px]">
                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                          <Badge className={isPago ? "bg-green-500" : "bg-orange-500"}>
                            {isPago ? "✓ Pago" : "⏳ Pendente"}
                          </Badge>
                          <Badge variant={isConfirmado ? "default" : "outline"} className={isConfirmado ? "bg-blue-600" : ""}>
                            {isConfirmado ? "✓ Presença confirmada" : "📝 Inscrito"}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:items-end">
                          {!isPago && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                              onClick={() => confirmarPagamentoEventoMutation.mutate(inscricao.id)}
                              disabled={confirmarPagamentoEventoMutation.isPending}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Confirmar Pagamento
                            </Button>
                          )}
                          {isPago && !isConfirmado && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                              onClick={() => confirmarPresencaEventoMutation.mutate(inscricao.id)}
                              disabled={confirmarPresencaEventoMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Dar Baixa (Presença)
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab de Pacotes de Treino */}
        <TabsContent value="pacotes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pacotes de Treino Disponíveis</h3>
          </div>

          {/* Pacotes Disponíveis */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pacotesTreino.map((pacote: any) => (
              <Card key={pacote.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">{pacote.nome}</h4>
                    <Badge variant="secondary">
                      {pacote.frequenciaSemanal}x/semana
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">{pacote.descricao}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        R$ {parseFloat(pacote.valor || "0").toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {pacote.duracao} dias
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2 text-blue-500" />
                      <span>Frequência: {pacote.frequenciaSemanal}x por semana</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                      <span>Duração: {pacote.duracao} dias</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    onClick={() => {
                      const formData = {
                        alunoId: 1,
                        pacoteId: pacote.id,
                        dataInicio: new Date().toISOString().split('T')[0],
                        dataFim: new Date(Date.now() + pacote.duracao * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'ativo',
                        valorPago: pacote.valor,
                        formaPagamento: 'pix'
                      };
                      
                      const handleContratarPacote = async () => {
                        try {
                          await apiRequest("POST", "/api/assinaturas-pacotes", formData);
                          toast({
                            title: "Sucesso",
                            description: `Pacote ${pacote.nome} contratado com sucesso!`,
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/assinaturas-pacotes"] });
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Erro ao contratar pacote",
                            variant: "destructive",
                          });
                        }
                      };
                      
                      handleContratarPacote();
                    }}
                  >
                    Contratar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Assinaturas Ativas */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Assinaturas Ativas</h3>
            <div className="grid gap-4">
              {assinaturasPacotes.map((assinatura: any) => (
                <Card key={assinatura.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{assinatura.aluno?.nome || "Aluno não encontrado"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {assinatura.pacote?.nome || "Pacote não encontrado"} • {assinatura.pacote?.frequenciaSemanal}x/semana
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(assinatura.dataInicio).toLocaleDateString('pt-BR')} - {new Date(assinatura.dataFim).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          R$ {parseFloat(assinatura.valorPago || "0").toFixed(2)}
                        </p>
                        <Badge variant={assinatura.status === 'ativo' ? 'default' : 'secondary'}>
                          {assinatura.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {assinaturasPacotes.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma assinatura de pacote encontrada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab de Notificações */}
        <TabsContent value="notificacoes" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Notificações para Responsáveis</h2>
              <p className="text-sm text-muted-foreground">Envie avisos e lembretes para os responsáveis dos alunos</p>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={async () => {
              try {
                const response = await apiRequest("POST", "/api/notificacoes/enviar-todos", {
                  titulo: "Aviso Geral",
                  mensagem: "Mensagem enviada pela escola de futebol.",
                  tipo: "geral"
                });
                const res = await response.json();
                toast({
                  title: "Sucesso",
                  description: res.message || "Notificação enviada para todos os responsáveis!",
                });
                queryClient.invalidateQueries({ queryKey: ["/api/notificacoes"] });
              } catch (error) {
                toast({
                  title: "Erro",
                  description: "Erro ao enviar notificações",
                  variant: "destructive",
                });
              }
            }}>
              <CardContent className="p-6 text-center">
                <Bell className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                <h3 className="font-semibold">Enviar para Todos</h3>
                <p className="text-sm text-muted-foreground">Notificar todos os responsáveis</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={async () => {
              try {
                const response = await apiRequest("POST", "/api/notificacoes/enviar-inadimplentes", {
                  titulo: "Mensalidade Pendente",
                  mensagem: "Você possui mensalidades pendentes. Por favor, regularize sua situação através do Portal do Responsável.",
                  tipo: "pagamento"
                });
                const res = await response.json();
                toast({
                  title: "Sucesso",
                  description: res.message || "Notificação enviada para inadimplentes!",
                });
                queryClient.invalidateQueries({ queryKey: ["/api/notificacoes"] });
              } catch (error) {
                toast({
                  title: "Erro",
                  description: "Erro ao enviar notificações",
                  variant: "destructive",
                });
              }
            }}>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-orange-500 mb-3" />
                <h3 className="font-semibold">Cobrar Inadimplentes</h3>
                <p className="text-sm text-muted-foreground">Notificar responsáveis com pagamentos pendentes</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowNotificacaoDialog(true)}>
              <CardContent className="p-6 text-center">
                <Plus className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <h3 className="font-semibold">Nova Notificação</h3>
                <p className="text-sm text-muted-foreground">Criar notificação personalizada</p>
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Histórico de Notificações Enviadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificacoesEnviadas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma notificação enviada ainda</p>
                ) : (
                  notificacoesEnviadas.slice(0, 20).map((notif: any) => (
                    <div key={notif.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${notif.lida ? 'bg-gray-300' : 'bg-blue-500'}`} />
                        <div>
                          <p className="font-medium">{notif.titulo}</p>
                          <p className="text-sm text-muted-foreground">{notif.mensagem}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={notif.tipo === 'pagamento' ? 'destructive' : 'secondary'}>
                          {notif.tipo}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Nova Notificação */}
      <Dialog open={showNotificacaoDialog} onOpenChange={setShowNotificacaoDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Notificação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={notificacaoForm.titulo}
                onChange={(e) => setNotificacaoForm(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Aviso Importante"
              />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={notificacaoForm.mensagem}
                onChange={(e) => setNotificacaoForm(prev => ({ ...prev, mensagem: e.target.value }))}
                placeholder="Digite a mensagem..."
                rows={4}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select 
                value={notificacaoForm.tipo} 
                onValueChange={(value) => setNotificacaoForm(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="uniforme">Uniforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Enviar para</Label>
              <Select 
                value={notificacaoForm.destinatario} 
                onValueChange={(value) => setNotificacaoForm(prev => ({ ...prev, destinatario: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Responsáveis</SelectItem>
                  <SelectItem value="inadimplentes">Apenas Inadimplentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificacaoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={async () => {
              try {
                const endpoint = notificacaoForm.destinatario === 'inadimplentes' 
                  ? "/api/notificacoes/enviar-inadimplentes" 
                  : "/api/notificacoes/enviar-todos";
                const response = await apiRequest("POST", endpoint, {
                  titulo: notificacaoForm.titulo,
                  mensagem: notificacaoForm.mensagem,
                  tipo: notificacaoForm.tipo
                });
                const res = await response.json();
                toast({
                  title: "Sucesso",
                  description: res.message || "Notificação enviada!",
                });
                queryClient.invalidateQueries({ queryKey: ["/api/notificacoes"] });
                setShowNotificacaoDialog(false);
                setNotificacaoForm({ titulo: "", mensagem: "", tipo: "geral", destinatario: "todos" });
              } catch (error) {
                toast({
                  title: "Erro",
                  description: "Erro ao enviar notificação",
                  variant: "destructive",
                });
              }
            }}>
              Enviar Notificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogs para criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "pagamento" && (editingPagamentoId ? "Editar Pagamento" : "Novo Pagamento")}
              {dialogType === "evento" && "Criar Evento"}
              {dialogType === "uniforme" && "Adicionar Uniforme"}
              {dialogType === "compra-uniforme" && "Comprar Uniforme"}
              {dialogType === "inscricao-evento" && "Inscrever em Evento"}
            </DialogTitle>
          </DialogHeader>
          
          {/* Form de Pagamento - Redesenhado */}
          {dialogType === "pagamento" && (
            <div className="space-y-6">
              {/* Seção: Aluno */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Selecione o Aluno
                </Label>
                <Select 
                  value={pagamentoForm.alunoId ? pagamentoForm.alunoId.toString() : ""}
                  onValueChange={(value) => setPagamentoForm(prev => ({ ...prev, alunoId: parseInt(value) }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Escolha o aluno para registrar o pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos.map((aluno) => (
                      <SelectItem key={aluno.id} value={aluno.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{aluno.nome}</span>
                          {aluno.filial && <Badge variant="outline" className="text-xs">{aluno.filial.nome}</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seção: Valor e Referência */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Valor (R$)
                  </Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="150.00"
                    className="h-12 text-lg font-semibold"
                    value={pagamentoForm.valor}
                    onChange={(e) => setPagamentoForm(prev => ({ ...prev, valor: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Mês de Referência
                  </Label>
                  <Input 
                    type="month"
                    className="h-12"
                    value={pagamentoForm.mesReferencia}
                    onChange={(e) => setPagamentoForm(prev => ({ ...prev, mesReferencia: e.target.value }))}
                  />
                </div>
              </div>

              {/* Seção: Data e Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Data do Pagamento</Label>
                  <Input 
                    type="date"
                    className="h-12"
                    value={pagamentoForm.dataPagamento}
                    onChange={(e) => setPagamentoForm(prev => ({ ...prev, dataPagamento: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Forma de Pagamento</Label>
                  <Select 
                    value={pagamentoForm.formaPagamento}
                    onValueChange={(value) => setPagamentoForm(prev => ({ ...prev, formaPagamento: value }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💳</span> PIX
                        </div>
                      </SelectItem>
                      <SelectItem value="dinheiro">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💵</span> Dinheiro
                        </div>
                      </SelectItem>
                      <SelectItem value="cartao_credito">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💳</span> Cartão de Crédito
                        </div>
                      </SelectItem>
                      <SelectItem value="cartao_debito">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💳</span> Cartão de Débito
                        </div>
                      </SelectItem>
                      <SelectItem value="transferencia">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏦</span> Transferência Bancária
                        </div>
                      </SelectItem>
                      <SelectItem value="boleto">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📄</span> Boleto
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seção: Observações */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Observações (opcional)</Label>
                <Textarea 
                  placeholder="Ex: Pagamento referente à mensalidade + material..."
                  className="min-h-[80px]"
                  value={pagamentoForm.observacoes}
                  onChange={(e) => setPagamentoForm(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>

              {/* Resumo do Pagamento */}
              {pagamentoForm.alunoId > 0 && pagamentoForm.valor && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Resumo do Pagamento</p>
                        <p className="text-lg font-bold text-green-800">
                          {alunos.find(a => a.id === pagamentoForm.alunoId)?.nome}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-700">
                          R$ {parseFloat(pagamentoForm.valor || "0").toFixed(2)}
                        </p>
                        <p className="text-sm text-green-600">
                          {pagamentoForm.mesReferencia && new Date(pagamentoForm.mesReferencia + "-01").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingPagamentoId(null);
                    setPagamentoForm({
                      alunoId: 0,
                      valor: "",
                      mesReferencia: "",
                      dataPagamento: new Date().toISOString().split('T')[0],
                      formaPagamento: "",
                      observacoes: "",
                    });
                  }} 
                  variant="outline" 
                  className="flex-1 h-12"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    if (!pagamentoForm.alunoId || !pagamentoForm.valor || !pagamentoForm.mesReferencia || !pagamentoForm.dataPagamento || !pagamentoForm.formaPagamento) {
                      toast({
                        title: "Campos obrigatórios",
                        description: "Preencha todos os campos para registrar o pagamento",
                        variant: "destructive",
                      });
                      return;
                    }

                    const pagamentoData = {
                      alunoId: pagamentoForm.alunoId,
                      valor: pagamentoForm.valor,
                      mesReferencia: pagamentoForm.mesReferencia,
                      dataPagamento: pagamentoForm.dataPagamento,
                      formaPagamento: pagamentoForm.formaPagamento,
                      observacoes: pagamentoForm.observacoes || null,
                    };

                    if (editingPagamentoId) {
                      updatePagamentoMutation.mutate({ id: editingPagamentoId, data: pagamentoData });
                    } else {
                      createPagamentoMutation.mutate(pagamentoData as InsertPagamento);
                    }
                  }}
                  disabled={createPagamentoMutation.isPending || updatePagamentoMutation.isPending}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                >
                  {(createPagamentoMutation.isPending || updatePagamentoMutation.isPending) ? (
                    <>{editingPagamentoId ? "Salvando..." : "Registrando..."}</>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      {editingPagamentoId ? "Salvar Alterações" : "Confirmar Pagamento"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Form de Evento */}
          {dialogType === "evento" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeEvento">Nome do Evento</Label>
                  <Input id="nomeEvento" placeholder="Ex: Torneio de Futebol" />
                </div>
                <div>
                  <Label htmlFor="dataEvento">Data do Evento</Label>
                  <Input id="dataEvento" type="date" />
                </div>
              </div>
              <div>
                <Label htmlFor="descricaoEvento">Descrição</Label>
                <Textarea id="descricaoEvento" placeholder="Descrição detalhada do evento..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="localEvento">Local</Label>
                  <Input id="localEvento" placeholder="Local do evento" />
                </div>
                <div>
                  <Label htmlFor="precoEvento">Preço (R$)</Label>
                  <Input id="precoEvento" type="number" step="0.01" placeholder="0,00" />
                </div>
                <div>
                  <Label htmlFor="vagasEvento">Vagas Máximas</Label>
                  <Input id="vagasEvento" type="number" placeholder="50" />
                </div>
              </div>
              <div>
                <Label htmlFor="horaInicio">Hora de Início</Label>
                <Input id="horaInicio" type="time" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateEvento}
                  disabled={createEventoMutation.isPending}
                  className="flex-1"
                >
                  {createEventoMutation.isPending ? "Criando..." : "Criar Evento"}
                </Button>
              </div>
            </div>
          )}

          {/* Form de Uniforme */}
          {dialogType === "uniforme" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeUniforme">Nome do Item</Label>
                  <Input 
                    id="nomeUniforme" 
                    placeholder="Ex: Camisa Oficial" 
                    value={uniformeForm.nome}
                    onChange={(e) => setUniformeForm(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select 
                    value={
                      ["camisa", "short", "meias", "chuteira", "acessorios"].includes(uniformeForm.categoria)
                        ? uniformeForm.categoria
                        : (uniformeForm.categoria ? "outra" : "")
                    }
                    onValueChange={(value) => {
                      if (value === "outra") {
                        setUniformeForm(prev => ({ ...prev, categoria: "" }));
                        setIsCriandoNovaCategoria(true);
                      } else {
                        setUniformeForm(prev => ({ ...prev, categoria: value }));
                        setIsCriandoNovaCategoria(false);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camisa">Camisa</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="meias">Meias</SelectItem>
                      <SelectItem value="chuteira">Chuteira</SelectItem>
                      <SelectItem value="acessorios">Acessórios</SelectItem>
                      <SelectItem value="outra">+ Criar Nova Categoria...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isCriandoNovaCategoria && (
                <div className="space-y-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label htmlFor="novaCategoria">Nome da Nova Categoria</Label>
                  <Input 
                    id="novaCategoria" 
                    placeholder="Digite o nome da nova categoria (ex: Mochilas)" 
                    value={uniformeForm.categoria}
                    onChange={(e) => setUniformeForm(prev => ({ ...prev, categoria: e.target.value }))}
                  />
                </div>
              )}
              
              {/* Campo de Imagem do Uniforme */}
              <div>
                <Label htmlFor="imagemUniforme">Imagem do Uniforme (URL ou Base64)</Label>
                <div className="mt-2 space-y-3">
                  <Input 
                    placeholder="Cole a URL da imagem ou use o seletor abaixo"
                    value={uniformeForm.imagemUrl}
                    onChange={(e) => setUniformeForm(prev => ({ ...prev, imagemUrl: e.target.value }))}
                  />
                  <div className="flex items-center gap-4">
                    <Input 
                      id="imagemUniforme" 
                      type="file" 
                      accept="image/*"
                      className="flex-1"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setUniformeForm(prev => ({ ...prev, imagemUrl: event.target?.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  {uniformeForm.imagemUrl && (
                    <div className="relative w-32 h-32">
                      <img 
                        src={uniformeForm.imagemUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setUniformeForm(prev => ({ ...prev, imagemUrl: "" }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="descricaoUniforme">Descrição</Label>
                <Textarea 
                  id="descricaoUniforme" 
                  placeholder="Descrição detalhada do item..." 
                  value={uniformeForm.descricao}
                  onChange={(e) => setUniformeForm(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="precoUniforme">Preço (R$)</Label>
                  <Input 
                    id="precoUniforme" 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00" 
                    value={uniformeForm.preco}
                    onChange={(e) => setUniformeForm(prev => ({ ...prev, preco: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="tamanhos">Tamanhos Disponíveis</Label>
                  <Input 
                    id="tamanhos" 
                    placeholder="P, M, G, GG" 
                    value={uniformeForm.tamanhos}
                    onChange={(e) => setUniformeForm(prev => ({ ...prev, tamanhos: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cores">Cores Disponíveis</Label>
                  <Input 
                    id="cores" 
                    placeholder="Azul, Branco, Vermelho" 
                    value={uniformeForm.cores}
                    onChange={(e) => setUniformeForm(prev => ({ ...prev, cores: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="estoque">Quantidade em Estoque</Label>
                <Input 
                  id="estoque" 
                  type="number" 
                  placeholder="100" 
                  value={uniformeForm.estoque}
                  onChange={(e) => setUniformeForm(prev => ({ ...prev, estoque: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveUniforme}
                  disabled={createUniformeMutation.isPending || updateUniformeMutation.isPending}
                  className="flex-1"
                >
                  {(createUniformeMutation.isPending || updateUniformeMutation.isPending) 
                    ? "Salvando..." 
                    : (editingUniformeId ? "Salvar Alterações" : "Adicionar Uniforme")
                  }
                </Button>
              </div>
            </div>
          )}

          {/* Form de Compra de Uniforme */}
          {dialogType === "compra-uniforme" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alunoCompra">Aluno</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id.toString()}>
                          {aluno.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="uniformeCompra">Uniforme</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o uniforme" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniformes.map((uniforme) => (
                        <SelectItem key={uniforme.id} value={uniforme.id.toString()}>
                          {uniforme.nome} - R$ {parseFloat(uniforme.preco || "0").toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input id="quantidade" type="number" defaultValue="1" min="1" />
                </div>
                <div>
                  <Label htmlFor="tamanhoEscolhido">Tamanho</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P">P</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="GG">GG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="corEscolhida">Cor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azul">Azul</SelectItem>
                      <SelectItem value="branco">Branco</SelectItem>
                      <SelectItem value="vermelho">Vermelho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="statusPagamentoUniforme">Status do Pagamento</Label>
                  <Select defaultValue="pendente">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusEntrega">Status da Entrega</Label>
                  <Select defaultValue="preparando">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preparando">Preparando</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button className="flex-1">
                  Registrar Compra
                </Button>
              </div>
            </div>
          )}

          {/* Form de Inscrição em Evento */}
          {dialogType === "inscricao-evento" && (() => {
            const eventoSelecionado = eventos.find(e => e.id === inscricaoEventoForm.eventoId);
            const alunoSelecionado = alunos.find(a => a.id === inscricaoEventoForm.alunoId);
            return (
              <div className="space-y-5">
                {eventoSelecionado && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-purple-700 font-semibold">Evento</p>
                          <h3 className="text-lg font-bold text-purple-900">{eventoSelecionado.nome}</h3>
                          <p className="text-xs text-purple-700 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(eventoSelecionado.dataEvento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">
                          R$ {parseFloat(eventoSelecionado.preco || "0").toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Selecione o Aluno
                  </Label>
                  <Select
                    value={inscricaoEventoForm.alunoId ? inscricaoEventoForm.alunoId.toString() : ""}
                    onValueChange={(value) => setInscricaoEventoForm(prev => ({ ...prev, alunoId: parseInt(value) }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Escolha o aluno que vai participar" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{aluno.nome}</span>
                            {aluno.filial && <Badge variant="outline" className="text-xs">{aluno.filial.nome}</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!eventoSelecionado && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      Selecione o Evento
                    </Label>
                    <Select
                      value={inscricaoEventoForm.eventoId ? inscricaoEventoForm.eventoId.toString() : ""}
                      onValueChange={(value) => setInscricaoEventoForm(prev => ({ ...prev, eventoId: parseInt(value) }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Escolha o evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventos.map((evento) => (
                          <SelectItem key={evento.id} value={evento.id.toString()}>
                            {evento.nome} - R$ {parseFloat(evento.preco || "0").toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Status do Pagamento</Label>
                    <Select
                      value={inscricaoEventoForm.statusPagamento}
                      onValueChange={(value) => setInscricaoEventoForm(prev => ({ ...prev, statusPagamento: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">⏳ Pendente</SelectItem>
                        <SelectItem value="pago">✓ Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Confirmação</Label>
                    <Select
                      value={inscricaoEventoForm.statusConfirmacao}
                      onValueChange={(value) => setInscricaoEventoForm(prev => ({ ...prev, statusConfirmacao: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inscrito">📝 Inscrito</SelectItem>
                        <SelectItem value="confirmado">✓ Presença confirmada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Observações (opcional)</Label>
                  <Textarea
                    placeholder="Ex: Necessidades especiais, alergias, restrições..."
                    className="min-h-[80px]"
                    value={inscricaoEventoForm.observacoes}
                    onChange={(e) => setInscricaoEventoForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  />
                </div>

                {alunoSelecionado && eventoSelecionado && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-green-700 font-semibold">Resumo</p>
                          <p className="text-base font-bold text-green-900">{alunoSelecionado.nome}</p>
                          <p className="text-xs text-green-700">
                            {alunoSelecionado.filial?.nome || "Sem unidade"} · {eventoSelecionado.nome}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          R$ {parseFloat(eventoSelecionado.preco || "0").toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3 pt-2">
                  <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1 h-12">
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
                    disabled={inscreverEventoMutation.isPending}
                    onClick={() => {
                      if (!inscricaoEventoForm.alunoId || !inscricaoEventoForm.eventoId) {
                        toast({
                          title: "Campos obrigatórios",
                          description: "Selecione o aluno e o evento para realizar a inscrição.",
                          variant: "destructive",
                        });
                        return;
                      }
                      inscreverEventoMutation.mutate({
                        alunoId: inscricaoEventoForm.alunoId,
                        eventoId: inscricaoEventoForm.eventoId,
                        statusPagamento: inscricaoEventoForm.statusPagamento,
                        statusConfirmacao: inscricaoEventoForm.statusConfirmacao,
                        observacoes: inscricaoEventoForm.observacoes || null,
                      } as InsertInscricaoEvento);
                    }}
                  >
                    {inscreverEventoMutation.isPending ? "Inscrevendo..." : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar Inscrição
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog de Pagamento em Lote */}
      <Dialog open={showLoteDialog} onOpenChange={setShowLoteDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Pagamento em Lote
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Resumo */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Aluno</p>
                    <p className="text-lg font-bold text-blue-800">
                      {alunos.find(a => a.id === selectedAlunoExtrato)?.nome}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700 font-medium">Meses Selecionados</p>
                    <p className="text-2xl font-bold text-blue-800">{mesesSelecionados.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meses selecionados */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Meses a Pagar</Label>
              <div className="flex flex-wrap gap-2">
                {mesesSelecionados.map(mes => (
                  <Badge key={mes} variant="secondary" className="text-sm py-1 px-3">
                    {new Date(mes + "-01").toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Valor por mês */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Valor por Mês (R$)
              </Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="150.00"
                className="h-12 text-lg font-semibold"
                value={lotePagamentoForm.valorMensal}
                onChange={(e) => setLotePagamentoForm(prev => ({ ...prev, valorMensal: e.target.value }))}
              />
            </div>

            {/* Forma de pagamento */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Forma de Pagamento</Label>
              <Select 
                value={lotePagamentoForm.formaPagamento}
                onValueChange={(value) => setLotePagamentoForm(prev => ({ ...prev, formaPagamento: value }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">💳 PIX</SelectItem>
                  <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">💳 Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">💳 Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">🏦 Transferência</SelectItem>
                  <SelectItem value="boleto">📄 Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data do pagamento */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Data do Pagamento</Label>
              <Input 
                type="date"
                className="h-12"
                value={lotePagamentoForm.dataPagamento}
                onChange={(e) => setLotePagamentoForm(prev => ({ ...prev, dataPagamento: e.target.value }))}
              />
            </div>

            {/* Total */}
            {lotePagamentoForm.valorMensal && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-green-700 font-medium">Total a Pagar</p>
                    <p className="text-3xl font-bold text-green-700">
                      R$ {(parseFloat(lotePagamentoForm.valorMensal || "0") * mesesSelecionados.length).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => {
                  setShowLoteDialog(false);
                  setLotePagamentoForm({
                    valorMensal: "",
                    formaPagamento: "",
                    dataPagamento: new Date().toISOString().split('T')[0],
                  });
                }} 
                variant="outline" 
                className="flex-1 h-12"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (!lotePagamentoForm.valorMensal || !lotePagamentoForm.formaPagamento || !selectedAlunoExtrato) {
                    toast({
                      title: "Campos obrigatórios",
                      description: "Preencha o valor e a forma de pagamento",
                      variant: "destructive",
                    });
                    return;
                  }

                  const pagamentosLote = mesesSelecionados.map(mes => ({
                    alunoId: selectedAlunoExtrato,
                    valor: lotePagamentoForm.valorMensal,
                    mesReferencia: mes,
                    dataPagamento: lotePagamentoForm.dataPagamento,
                    formaPagamento: lotePagamentoForm.formaPagamento,
                    observacoes: `Pagamento em lote - ${mesesSelecionados.length} meses`,
                  })) as InsertPagamento[];

                  createPagamentoLoteMutation.mutate(pagamentosLote);
                }}
                disabled={createPagamentoLoteMutation.isPending}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
              >
                {createPagamentoLoteMutation.isPending ? (
                  <>Processando...</>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Confirmar Pagamento
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Plano Financeiro */}
      <Dialog open={showPlanoDialog} onOpenChange={setShowPlanoDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              {editingPlanoId ? "Editar Plano Financeiro" : "Novo Plano Financeiro"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Nome do Plano */}
            <div className="space-y-2">
              <Label htmlFor="nomePlano">Nome do Plano *</Label>
              <Input 
                id="nomePlano"
                placeholder="Ex: Mensal, Trimestral, Semestral..."
                value={planoForm.nome}
                onChange={(e) => setPlanoForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricaoPlano">Descrição</Label>
              <Textarea 
                id="descricaoPlano"
                placeholder="Descrição do plano..."
                value={planoForm.descricao}
                onChange={(e) => setPlanoForm(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>

            {/* Valor Mensal e Quantidade de Meses */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorMensalPlano">Valor Mensal (R$) *</Label>
                <Input 
                  id="valorMensalPlano"
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={planoForm.valorMensal}
                  onChange={(e) => setPlanoForm(prev => ({ ...prev, valorMensal: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidadeMeses">Duração (meses) *</Label>
                <Select 
                  value={planoForm.quantidadeMeses}
                  onValueChange={(value) => setPlanoForm(prev => ({ ...prev, quantidadeMeses: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mês (Mensal)</SelectItem>
                    <SelectItem value="3">3 meses (Trimestral)</SelectItem>
                    <SelectItem value="6">6 meses (Semestral)</SelectItem>
                    <SelectItem value="12">12 meses (Anual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Desconto e Dia Vencimento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descontoPlano">Desconto (%)</Label>
                <Input 
                  id="descontoPlano"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={planoForm.descontoPercentual}
                  onChange={(e) => setPlanoForm(prev => ({ ...prev, descontoPercentual: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diaVencimento">Dia Vencimento</Label>
                <Input 
                  id="diaVencimento"
                  type="number"
                  min="1"
                  max="28"
                  placeholder="10"
                  value={planoForm.diaVencimento}
                  onChange={(e) => setPlanoForm(prev => ({ ...prev, diaVencimento: e.target.value }))}
                />
              </div>
            </div>

            {/* Taxa Matrícula e Filial */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxaMatricula">Taxa Matrícula (R$)</Label>
                <Input 
                  id="taxaMatricula"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={planoForm.taxaMatricula}
                  onChange={(e) => setPlanoForm(prev => ({ ...prev, taxaMatricula: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filialPlano">Unidade (opcional)</Label>
                <Select 
                  value={planoForm.filialId?.toString() || "todas"}
                  onValueChange={(value) => setPlanoForm(prev => ({ 
                    ...prev, 
                    filialId: value === "todas" ? null : parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as unidades</SelectItem>
                    {filiaisData.map((filial) => (
                      <SelectItem key={filial.id} value={filial.id.toString()}>
                        {filial.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview do Valor Total */}
            {planoForm.valorMensal && parseInt(planoForm.quantidadeMeses) > 1 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Valor Total do Plano</p>
                      <p className="text-xs text-green-600">
                        {planoForm.quantidadeMeses} meses × R$ {parseFloat(planoForm.valorMensal || "0").toFixed(2)}
                        {parseFloat(planoForm.descontoPercentual || "0") > 0 && ` - ${planoForm.descontoPercentual}% desconto`}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      R$ {(
                        parseFloat(planoForm.valorMensal || "0") * 
                        parseInt(planoForm.quantidadeMeses) * 
                        (1 - parseFloat(planoForm.descontoPercentual || "0") / 100)
                      ).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => {
                  setShowPlanoDialog(false);
                  setEditingPlanoId(null);
                  resetPlanoForm();
                }} 
                variant="outline" 
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSavePlano}
                disabled={!planoForm.nome || !planoForm.valorMensal || createPlanoMutation.isPending || updatePlanoMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {(createPlanoMutation.isPending || updatePlanoMutation.isPending) ? (
                  <>Salvando...</>
                ) : editingPlanoId ? (
                  <>Atualizar Plano</>
                ) : (
                  <>Criar Plano</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}