import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useResponsavel, logoutResponsavel } from "@/hooks/useResponsavel";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AlunoWithFilial, InsertAluno, Filial } from "@shared/schema";
import AlunoFormResponsavel from "@/components/forms/AlunoFormResponsavel";
import { MercadoPagoBrick } from "@/components/pagamento/MercadoPagoBrick";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  User, 
  CreditCard, 
  Calendar, 
  ShoppingBag, 
  LogOut,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Gift,
  Loader2,
  Plus,
  Edit,
  Download,
  Camera,
  ImageIcon,
  Package,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { InterLogo } from "@/components/InterLogo";

export default function ResponsavelPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [perfilForm, setPerfilForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: ""
  });

  const { responsavel, isLoading, isAuthenticated } = useResponsavel();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Atualizar formulário de perfil quando os dados do responsável carregarem
  useEffect(() => {
    if (responsavel) {
      setPerfilForm(prev => ({
        ...prev,
        nome: responsavel.nome,
        email: responsavel.email,
        telefone: responsavel.telefone || ""
      }));
    }
  }, [responsavel]);
  
  // Buscar configurações do sistema (logo e nome)
  const { data: configSistema } = useQuery<{ logoUrl: string | null; nomeEscola: string }>({
    queryKey: ["/api/configuracoes"],
  });
  const [showAlunoForm, setShowAlunoForm] = useState(false);
  const [editingAluno, setEditingAluno] = useState<AlunoWithFilial | null>(null);
  const [checkoutUniforme, setCheckoutUniforme] = useState<any | null>(null);
  const [checkoutData, setCheckoutData] = useState({
    tamanho: "",
    cor: "",
    quantidade: 1,
    alunoId: 0,
    formaPagamento: "pix"
  });
  const [checkoutMensalidade, setCheckoutMensalidade] = useState<any | null>(null);
  const [selectedAlunoExtrato, setSelectedAlunoExtrato] = useState<number | null>(null);
  const [checkoutEvento, setCheckoutEvento] = useState<any | null>(null);
  const [uniformeSlideIdx, setUniformeSlideIdx] = useState<Record<number, number>>({});

  // Converte campo imagemUrl em array (suporta JSON array OU string única)
  const parseImagens = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    const trimmed = String(raw).trim();
    if (trimmed.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmed);
        return Array.isArray(arr) ? arr.filter(Boolean) : [];
      } catch {
        return [trimmed];
      }
    }
    return [trimmed];
  };

  // Converte string de tamanhos (CSV ou JSON) em array
  const parseTamanhos = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    const trimmed = String(raw).trim();
    if (trimmed.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmed);
        return Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
      } catch {
        return trimmed.split(",").map(s => s.trim()).filter(Boolean);
      }
    }
    return trimmed.split(",").map(s => s.trim()).filter(Boolean);
  };

  // Queries
  const { data: filiais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const { data: alunos, isLoading: alunosLoading } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/alunos"],
  });

  const { data: pacotesTreino = [] } = useQuery<any[]>({
    queryKey: ["/api/pacotes-treino"],
  });

  const { data: assinaturasPacotes = [] } = useQuery<any[]>({
    queryKey: ["/api/assinaturas-pacotes"],
  });

  const { data: uniformes = [] } = useQuery<any[]>({
    queryKey: ["/api/uniformes"],
  });

  const { data: eventos = [] } = useQuery<any[]>({
    queryKey: ["/api/eventos"],
  });

  const { data: inscricoesEventos = [] } = useQuery<any[]>({
    queryKey: ["/api/inscricoes-eventos"],
  });

  const { data: pagamentos = [] } = useQuery<any[]>({
    queryKey: ["/api/pagamentos/responsavel"],
    enabled: !!responsavel?.id,
  });

  const { data: meusCompras = [], isLoading: meusComprasLoading } = useQuery<any[]>({
    queryKey: ["/api/compras-uniformes/minhas"],
    enabled: !!responsavel?.id,
  });

  console.log("meusCompras:", meusCompras, "loading:", meusComprasLoading, "responsavel:", responsavel?.id);

  // Mutations
  const contratarPacoteMutation = useMutation({
    mutationFn: async (data: { alunoId: number; pacoteId: number; formaPagamento: string; observacoes?: string }) => {
      const response = await apiRequest("POST", "/api/assinaturas-pacotes", {
        alunoId: data.alunoId,
        pacoteId: data.pacoteId,
        status: "ativo",
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
        valorPago: "0.00",
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Pacote contratado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assinaturas-pacotes"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao contratar pacote. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const comprarUniformeMutation = useMutation({
    mutationFn: async (data: { uniformeId: number; alunoId: number; quantidade: number; tamanho: string; cor: string; formaPagamento: string }) => {
      const uniforme = uniformes.find((u: any) => u.id === data.uniformeId);
      const response = await apiRequest("POST", "/api/compras-uniformes", {
        uniformeId: data.uniformeId,
        alunoId: data.alunoId,
        quantidade: data.quantidade,
        tamanho: data.tamanho,
        cor: data.cor,
        preco: uniforme?.preco || "0",
        statusPagamento: "pago"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Compra realizada!",
        description: "Pagamento aprovado via Mercado Pago.",
      });
      setCheckoutUniforme(null);
      setCheckoutData({ tamanho: "", cor: "", quantidade: 1, alunoId: 0, formaPagamento: "pix" });
      queryClient.invalidateQueries({ queryKey: ["/api/compras-uniformes"] });
      queryClient.refetchQueries({ queryKey: ["/api/compras-uniformes/minhas"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao realizar compra. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const inscreverEventoMutation = useMutation({
    mutationFn: async (data: { eventoId: number; alunoId: number; formaPagamento: string }) => {
      const response = await apiRequest("POST", "/api/inscricoes-eventos", {
        eventoId: data.eventoId,
        alunoId: data.alunoId,
        statusPagamento: "pago",
        formaPagamento: data.formaPagamento
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Inscrição realizada!",
        description: "Pagamento aprovado via Mercado Pago.",
      });
      setCheckoutEvento(null);
      queryClient.invalidateQueries({ queryKey: ["/api/inscricoes-eventos"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao realizar inscrição. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createPreferenceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/mercadopago/create-preference", data);
      return response.json();
    },
    onSuccess: (preference) => {
      if (preference.init_point) {
        window.location.href = preference.init_point;
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro no Pagamento", 
        description: error.message || "Não foi possível gerar o link do Mercado Pago.", 
        variant: "destructive" 
      });
    }
  });

  const createAlunoMutation = useMutation({
    mutationFn: async (data: InsertAluno) => {
      return await apiRequest("POST", "/api/alunos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/responsaveis/me"] });
      setShowAlunoForm(false);
      setEditingAluno(null);
      toast({
        title: "Sucesso",
        description: "Aluno cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar aluno",
        variant: "destructive",
      });
    },
  });

  const updateAlunoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAluno> }) => {
      return await apiRequest("PATCH", `/api/alunos/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/responsaveis/me"] });
      setShowAlunoForm(false);
      setEditingAluno(null);
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar aluno",
        variant: "destructive",
      });
    },
  });

  // Filtrar alunos do responsável
  const alunosDoResponsavel = alunos?.filter(aluno => aluno.responsavelId === responsavel?.id) || [];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa fazer login para acessar o portal.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/responsavel/login";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !responsavel) {
    return null; // Will redirect to login
  }

  const handleLogout = async () => {
    await logoutResponsavel();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-blue-50 shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center overflow-hidden">
                {configSistema?.logoUrl ? (
                  <img src={configSistema.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-blue-600 rounded-lg flex items-center justify-center">
                    <InterLogo size={32} />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{configSistema?.nomeEscola || "Portal dos Responsáveis"}</h1>
                <p className="text-xs sm:text-sm text-gray-600">Bem-vindo, {responsavel.nome}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleLogout} variant="outline" size="sm" className="text-xs sm:text-sm">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
                <span className="sm:hidden">🚪</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-8 h-auto p-1 bg-muted text-muted-foreground rounded-lg gap-1">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="alunos" className="text-xs sm:text-sm">👨‍👩‍👧‍👦 Filhos</TabsTrigger>
            <TabsTrigger value="pagamentos" className="text-xs sm:text-sm">💳 Pagamentos</TabsTrigger>
            <TabsTrigger value="pacotes" className="text-xs sm:text-sm">🏃‍♂️ Pacotes</TabsTrigger>
            <TabsTrigger value="eventos" className="text-xs sm:text-sm">📅 Eventos</TabsTrigger>
            <TabsTrigger value="uniformes" className="text-xs sm:text-sm">👕 Uniformes</TabsTrigger>
            <TabsTrigger value="meus-pedidos" className="text-xs sm:text-sm">📦 Pedidos</TabsTrigger>
            <TabsTrigger value="perfil" className="text-xs sm:text-sm">👤 Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Filhos Matriculados</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{alunosDoResponsavel.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pagamentos em Dia</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {alunosDoResponsavel.filter(aluno => !aluno.statusPagamento?.emDia).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Seus Filhos</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {alunosDoResponsavel.length === 0 ? (
                  <Card className="md:col-span-2 p-10 text-center bg-white border-dashed border-blue-200">
                    <Users className="w-16 h-12 text-blue-200 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-gray-800">Nenhum filho encontrado</h4>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">Você ainda não tem filhos vinculados a este portal. Cadastre agora para começar a acompanhar.</p>
                    <Button onClick={() => {
                      setActiveTab("alunos");
                      setShowAlunoForm(true);
                    }} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" /> Cadastrar Meu Filho
                    </Button>
                  </Card>
                ) : (
                  alunosDoResponsavel.map((aluno: any) => (
                    <Card key={aluno.id} className="bg-blue-50 border-blue-200">
                      <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          {aluno.fotoUrl ? (
                            <div className="relative group">
                              <img 
                                src={aluno.fotoUrl} 
                                alt={aluno.nome}
                                className="w-12 h-12 rounded-full object-cover cursor-pointer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = aluno.fotoUrl!;
                                  link.download = `foto-${aluno.nome.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
                                <span className="text-white text-xs opacity-0 group-hover:opacity-100">⬇</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Foto</span>
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-base">{aluno.nome}</CardTitle>
                            <p className="text-sm text-gray-600">
                              {aluno.filial?.nome || "Unidade não informada"}
                            </p>
                            {aluno.cpf && (
                              <p className="text-xs text-gray-500 font-mono">
                                CPF: {aluno.cpf}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={aluno.statusPagamento?.emDia ? "default" : "destructive"}
                        >
                          {aluno.statusPagamento?.emDia ? "Em dia" : "Atrasado"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <span className={aluno.ativo ? "text-green-600" : "text-red-600"}>
                            {aluno.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        {aluno.dataMatricula && (
                          <div className="flex justify-between text-sm">
                            <span>Data de matrícula:</span>
                            <span>{new Date(aluno.dataMatricula).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        {aluno.statusPagamento?.ultimoPagamento && (
                          <div className="flex justify-between text-sm">
                            <span>Último pagamento:</span>
                            <span>{aluno.statusPagamento.ultimoPagamento}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alunos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Meus Filhos</h2>
              <Button onClick={() => {
                setEditingAluno(null);
                setShowAlunoForm(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Filho
              </Button>
            </div>

            {alunosLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Foto</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Matrícula</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunos?.filter(aluno => aluno.responsavelId === responsavel?.id).map((aluno) => (
                      <TableRow key={aluno.id}>
                        <TableCell>
                          {aluno.fotoUrl ? (
                            <div className="relative group">
                              <img 
                                src={aluno.fotoUrl} 
                                alt={aluno.nome}
                                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = aluno.fotoUrl!;
                                  link.download = `foto-${aluno.nome.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
                                <Download className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{aluno.nome}</TableCell>
                        <TableCell>
                          {aluno.cpf ? (
                            <span className="font-mono text-sm">{aluno.cpf}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Não informado</span>
                          )}
                        </TableCell>
                        <TableCell>{aluno.email || '-'}</TableCell>
                        <TableCell>{aluno.telefone || '-'}</TableCell>
                        <TableCell>{aluno.filial?.nome || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={aluno.ativo ? "default" : "secondary"}>
                            {aluno.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {aluno.dataMatricula 
                            ? new Date(aluno.dataMatricula).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAluno(aluno);
                                setShowAlunoForm(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {alunos?.filter(aluno => aluno.responsavelId === responsavel?.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Nenhum filho cadastrado</h3>
                    <p className="text-sm">Clique em "Cadastrar Filho" para adicionar um novo aluno.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pagamentos">
            <div className="space-y-6">
              {/* Resumo por Aluno */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Situação dos Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alunosDoResponsavel.map((aluno: any) => {
                      const pagamentosAluno = pagamentos.filter((p: any) => p.alunoId === aluno.id);
                      const ultimoPagamento = pagamentosAluno.sort((a: any, b: any) => 
                        new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
                      )[0];
                      const mesAtual = new Date().toISOString().slice(0, 7);
                      const emDia = ultimoPagamento?.mesReferencia >= mesAtual;
                      
                      return (
                        <div key={aluno.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{aluno.nome}</h4>
                              <p className="text-sm text-gray-600">{aluno.filial?.nome}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={emDia ? "default" : "destructive"}>
                                {emDia ? "Em dia" : "Pendente"}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedAlunoExtrato(selectedAlunoExtrato === aluno.id ? null : aluno.id)}
                              >
                                {selectedAlunoExtrato === aluno.id ? "Fechar Extrato" : "Ver Extrato"}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Extrato do Aluno */}
                          {selectedAlunoExtrato === aluno.id && (
                            <div className="mt-4 border-t pt-4">
                              <h5 className="font-medium mb-3">Extrato de Mensalidades</h5>
                              
                              {/* Gerar 12 meses a partir da data de matrícula */}
                              {(() => {
                                const meses = [];
                                // Usar data de matrícula do aluno como início
                                const dataMatricula = aluno.dataMatricula 
                                  ? new Date(aluno.dataMatricula) 
                                  : new Date();
                                
                                // Gerar 12 meses a partir da matrícula
                                for (let i = 0; i < 12; i++) {
                                  const data = new Date(dataMatricula.getFullYear(), dataMatricula.getMonth() + i, 1);
                                  const mesRef = data.toISOString().slice(0, 7);
                                  const pagamento = pagamentosAluno.find((p: any) => p.mesReferencia === mesRef);
                                  meses.push({ mesRef, data, pagamento });
                                }
                                
                                return (
                                  <div className="space-y-2">
                                    {meses.map(({ mesRef, data, pagamento }) => (
                                      <div key={mesRef} className={`flex items-center justify-between p-3 rounded-lg ${
                                        pagamento?.status === "pago" ? "bg-green-50 border border-green-200" :
                                        new Date(mesRef) < new Date(new Date().toISOString().slice(0, 7)) ? "bg-red-50 border border-red-200" :
                                        "bg-gray-50 border border-gray-200"
                                      }`}>
                                        <div>
                                          <p className="font-medium">
                                            {data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                          </p>
                                          {pagamento && (
                                            <p className="text-sm text-gray-500">
                                              Pago em: {new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR')}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="font-bold">
                                            R$ {pagamento?.valor || "150,00"}
                                          </span>
                                          {pagamento?.status === "pago" ? (
                                            <Badge className="bg-green-500">✓ Pago</Badge>
                                          ) : (
                                            <Button 
                                              size="sm"
                                              onClick={() => setCheckoutMensalidade({
                                                alunoId: aluno.id,
                                                alunoNome: aluno.nome,
                                                mesReferencia: mesRef,
                                                mesNome: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                                                valor: "150.00"
                                              })}
                                            >
                                              <CreditCard className="w-4 h-4 mr-1" />
                                              Pagar
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                              
                              {/* Resumo */}
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex justify-between">
                                  <span>Total Pago:</span>
                                  <span className="font-bold text-green-600">
                                    R$ {pagamentosAluno.filter((p: any) => p.status === "pago")
                                      .reduce((acc: number, p: any) => acc + parseFloat(p.valor || "0"), 0)
                                      .toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pacotes">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Pacotes de Treino Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {pacotesTreino.map((pacote: any) => (
                      <Card key={pacote.id} className="border-2 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{pacote.nome}</CardTitle>
                          <p className="text-2xl font-bold text-green-600">
                            R$ {parseFloat(pacote.valor).toFixed(2)}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-gray-600">{pacote.descricao}</p>
                          <div className="text-sm text-gray-500">
                            <p><strong>Duração:</strong> {pacote.duracao}</p>
                            <p><strong>Frequência:</strong> {
                              pacote.nome.includes('3x') ? '3 vezes por semana' :
                              pacote.nome.includes('2x') ? '2 vezes por semana' :
                              '1 vez por semana'
                            }</p>
                          </div>
                          
                          {/* Seletor de aluno */}
                          <div className="space-y-3">
                            <label className="text-sm font-medium">Selecione o filho:</label>
                            <select 
                              className="w-full p-2 border rounded-md"
                              onChange={(e) => {
                                const alunoId = parseInt(e.target.value);
                                if (alunoId) {
                                  contratarPacoteMutation.mutate({
                                    alunoId,
                                    pacoteId: pacote.id,
                                    formaPagamento: "pendente",
                                    observacoes: `Contratação do pacote ${pacote.nome}`
                                  });
                                }
                                e.target.value = "";
                              }}
                              disabled={contratarPacoteMutation.isPending}
                            >
                              <option value="">Escolha um filho</option>
                              {alunos?.filter(aluno => aluno.responsavelId === responsavel?.id).map(aluno => (
                                <option key={aluno.id} value={aluno.id}>
                                  {aluno.nome}
                                </option>
                              ))}
                            </select>
                            {contratarPacoteMutation.isPending && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Contratando pacote...
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pacotes Contratados */}
              {assinaturasPacotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pacotes Contratados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assinaturasPacotes.map((assinatura: any) => {
                        const aluno = alunos?.find(a => a.id === assinatura.alunoId);
                        const pacote = pacotesTreino.find((p: any) => p.id === assinatura.pacoteId);
                        
                        return (
                          <div key={assinatura.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{aluno?.nome}</h4>
                                <p className="text-sm text-gray-600">{pacote?.nome}</p>
                                <p className="text-sm text-gray-500">
                                  Período: {new Date(assinatura.dataInicio).toLocaleDateString()} - {new Date(assinatura.dataFim).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">R$ {pacote?.valor}</p>
                                <Badge 
                                  variant={assinatura.status === "ativo" ? "default" : "secondary"}
                                >
                                  {assinatura.status}
                                </Badge>
                              </div>
                            </div>
                            {assinatura.observacoes && (
                              <p className="text-sm text-gray-600 mt-2">
                                {assinatura.observacoes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="eventos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Eventos e Competições
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventos.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">
                      Nenhum evento disponível no momento.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventos.filter((e: any) => e.ativo !== false).map((evento: any) => {
                      // Verificar se algum aluno já está inscrito
                      const alunoIds = alunosDoResponsavel.map((a: any) => a.id);
                      const inscricoesDoEvento = inscricoesEventos.filter(
                        (i: any) => i.eventoId === evento.id && alunoIds.includes(i.alunoId)
                      );
                      const jaInscrito = inscricoesDoEvento.length > 0;
                      
                      return (
                        <Card key={evento.id} className="overflow-hidden border hover:shadow-lg transition-shadow">
                          {evento.imagemUrl ? (
                            <div className="w-full h-48 bg-white flex items-center justify-center p-2">
                              <img 
                                src={evento.imagemUrl} 
                                alt={evento.nome}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                              <Calendar className="w-16 h-16 text-purple-200" />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold text-lg">{evento.nome}</h3>
                                {evento.descricao && (
                                  <p className="text-sm text-gray-500 mt-1">{evento.descricao}</p>
                                )}
                              </div>
                              
                              <div className="text-sm space-y-1">
                                {evento.dataEvento && (
                                  <p className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {new Date(evento.dataEvento).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                                {evento.local && (
                                  <p className="text-gray-500">📍 {evento.local}</p>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between pt-2">
                                <p className="text-xl font-bold text-green-600">
                                  {evento.preco && parseFloat(evento.preco) > 0 
                                    ? `R$ ${parseFloat(evento.preco).toFixed(2).replace('.', ',')}`
                                    : 'Gratuito'
                                  }
                                </p>
                                
                                {jaInscrito ? (
                                  <Badge className="bg-green-500">✓ Inscrito</Badge>
                                ) : (
                                  <Button 
                                    size="sm"
                                    onClick={() => setCheckoutEvento(evento)}
                                  >
                                    Inscrever
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uniformes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Loja de Uniformes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uniformes.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">
                      Nenhum uniforme disponível no momento.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uniformes.filter((u: any) => u.ativo !== false).map((uniforme: any) => {
                      const imagens = parseImagens(uniforme.imagemUrl);
                      const idx = Math.min(uniformeSlideIdx[uniforme.id] || 0, Math.max(imagens.length - 1, 0));
                      const goPrev = () => setUniformeSlideIdx(prev => ({ ...prev, [uniforme.id]: (idx - 1 + imagens.length) % imagens.length }));
                      const goNext = () => setUniformeSlideIdx(prev => ({ ...prev, [uniforme.id]: (idx + 1) % imagens.length }));
                      return (
                      <Card key={uniforme.id} className="overflow-hidden border hover:shadow-lg transition-shadow">
                        <div className="relative w-full h-72 bg-white flex items-center justify-center p-2 group">
                          {imagens.length > 0 ? (
                            <>
                              <img
                                src={imagens[idx]}
                                alt={uniforme.nome}
                                className="max-w-full max-h-full object-contain"
                                onError={(e: any) => { e.target.src = 'https://placehold.co/400x400?text=Sem+Imagem'; }}
                              />
                              {imagens.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={goPrev}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition"
                                    aria-label="Imagem anterior"
                                  >
                                    <ChevronLeft className="w-5 h-5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={goNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition"
                                    aria-label="Próxima imagem"
                                  >
                                    <ChevronRight className="w-5 h-5" />
                                  </button>
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {imagens.map((_, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setUniformeSlideIdx(prev => ({ ...prev, [uniforme.id]: i }))}
                                        className={`w-2 h-2 rounded-full transition ${i === idx ? "bg-blue-600" : "bg-white/70 hover:bg-white"}`}
                                        aria-label={`Ir para imagem ${i + 1}`}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                              <ShoppingBag className="w-16 h-16 text-blue-200" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-lg">{uniforme.nome}</h3>
                              {uniforme.descricao && (
                                <p className="text-sm text-gray-500 mt-1">{uniforme.descricao}</p>
                              )}
                            </div>
                            
                            {parseTamanhos(uniforme.tamanhos).length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Tamanhos disponíveis:</p>
                                <div className="flex flex-wrap gap-1">
                                  {parseTamanhos(uniforme.tamanhos).map((t: string) => (
                                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {parseTamanhos(uniforme.cores).length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Cores:</p>
                                <div className="flex flex-wrap gap-1">
                                  {parseTamanhos(uniforme.cores).map((c: string) => (
                                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div>
                                <p className="text-2xl font-bold text-green-600">
                                  R$ {parseFloat(uniforme.preco || "0").toFixed(2).replace('.', ',')}
                                </p>
                                {uniforme.estoque > 0 ? (
                                  <p className="text-xs text-green-600">Em estoque</p>
                                ) : (
                                  <p className="text-xs text-red-500">Indisponível</p>
                                )}
                              </div>
                              <Button 
                                size="sm"
                                disabled={uniforme.estoque <= 0}
                                onClick={() => {
                                  setCheckoutUniforme(uniforme);
                                  setCheckoutData({
                                    tamanho: parseTamanhos(uniforme.tamanhos)[0] || "",
                                    cor: parseTamanhos(uniforme.cores)[0] || "",
                                    quantidade: 1,
                                    alunoId: alunosDoResponsavel[0]?.id || 0,
                                    formaPagamento: "pix"
                                  });
                                }}
                              >
                                <ShoppingBag className="w-4 h-4 mr-1" />
                                Comprar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Meus Pedidos */}
          <TabsContent value="meus-pedidos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Meus Pedidos de Uniformes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {meusCompras.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">
                      Você ainda não fez nenhum pedido de uniforme.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("uniformes")}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Ver Loja de Uniformes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {meusCompras.map((compra: any) => {
                      const uniforme = uniformes.find((u: any) => u.id === compra.uniformeId);
                      const aluno = alunosDoResponsavel.find((a: any) => a.id === compra.alunoId);
                      return (
                        <Card key={compra.id} className={compra.statusPagamento === "pendente" ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4">
                                {parseImagens(uniforme?.imagemUrl).length > 0 ? (
                                  <img src={parseImagens(uniforme?.imagemUrl)[0]} alt={uniforme?.nome} className="w-16 h-16 object-cover rounded" />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-semibold">{uniforme?.nome || "Uniforme"}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Para: {aluno?.nome || "Aluno"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Tam: {compra.tamanho} • Cor: {compra.cor} • Qtd: {compra.quantidade}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Pedido em: {compra.dataCompra ? new Date(compra.dataCompra).toLocaleDateString('pt-BR') : '-'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <p className="text-xl font-bold text-green-600">
                                  R$ {(parseFloat(compra.preco || "0") * (compra.quantidade || 1)).toFixed(2).replace('.', ',')}
                                </p>
                                <div className="flex flex-col gap-1">
                                  <Badge className={compra.statusPagamento === "pago" ? "bg-green-500" : "bg-orange-500"}>
                                    {compra.statusPagamento === "pago" ? "✓ Pago" : "⏳ Aguardando Pagamento"}
                                  </Badge>
                                  <Badge variant="outline">
                                    {compra.statusEntrega === "entregue" ? "✓ Entregue" : "📦 Preparando"}
                                  </Badge>
                                </div>
                                {compra.statusPagamento === "pendente" && (
                                  <div className="flex gap-2 justify-end mt-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-red-600 border-red-300 hover:bg-red-50"
                                      onClick={async () => {
                                        if (confirm("Tem certeza que deseja cancelar este pedido?")) {
                                          try {
                                            await apiRequest("DELETE", `/api/compras-uniformes/${compra.id}`);
                                            await queryClient.refetchQueries({ queryKey: ["/api/compras-uniformes/minhas"] });
                                            toast({ title: "Sucesso", description: "Pedido cancelado!" });
                                          } catch (error) {
                                            toast({ title: "Erro", description: "Erro ao cancelar pedido", variant: "destructive" });
                                          }
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Cancelar Pedido
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
              </CardContent>
            </Card>
          </TabsContent>
          {/* Aba Perfil */}
          <TabsContent value="perfil" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Meus Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-2xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome Completo</label>
                      <Input 
                        value={perfilForm.nome} 
                        onChange={e => setPerfilForm({...perfilForm, nome: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input 
                        type="email" 
                        value={perfilForm.email} 
                        onChange={e => setPerfilForm({...perfilForm, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Telefone</label>
                      <Input 
                        value={perfilForm.telefone} 
                        onChange={e => setPerfilForm({...perfilForm, telefone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-600">
                      <Clock className="w-4 h-4" />
                      Trocar Senha (Deixe em branco se não quiser alterar)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Senha Atual</label>
                        <Input 
                          type="password" 
                          value={perfilForm.senhaAtual} 
                          onChange={e => setPerfilForm({...perfilForm, senhaAtual: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nova Senha</label>
                        <Input 
                          type="password" 
                          value={perfilForm.novaSenha} 
                          onChange={e => setPerfilForm({...perfilForm, novaSenha: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Confirmar Nova Senha</label>
                        <Input 
                          type="password" 
                          value={perfilForm.confirmarSenha} 
                          onChange={e => setPerfilForm({...perfilForm, confirmarSenha: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={async () => {
                        if (perfilForm.novaSenha && perfilForm.novaSenha !== perfilForm.confirmarSenha) {
                          toast({ title: "Erro", description: "As novas senhas não coincidem.", variant: "destructive" });
                          return;
                        }
                        
                        try {
                          await apiRequest("PATCH", "/api/responsaveis/me", {
                            nome: perfilForm.nome,
                            email: perfilForm.email,
                            telefone: perfilForm.telefone,
                            senhaAtual: perfilForm.senhaAtual,
                            novaSenha: perfilForm.novaSenha || undefined
                          });
                          
                          toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
                          queryClient.invalidateQueries({ queryKey: ["/api/responsaveis/me"] });
                          setPerfilForm(prev => ({ ...prev, senhaAtual: "", novaSenha: "", confirmarSenha: "" }));
                        } catch (error: any) {
                          toast({ 
                            title: "Erro ao atualizar", 
                            description: error.message || "Senha atual incorreta ou erro no servidor.", 
                            variant: "destructive" 
                          });
                        }
                      }}
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Checkout */}
      <Dialog open={!!checkoutUniforme} onOpenChange={() => setCheckoutUniforme(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Finalizar Compra
            </DialogTitle>
          </DialogHeader>
          
          {checkoutUniforme && (
            <div className="space-y-4">
              {/* Produto */}
              <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                {parseImagens(checkoutUniforme.imagemUrl).length > 0 ? (
                  <img 
                    src={parseImagens(checkoutUniforme.imagemUrl)[0]} 
                    alt={checkoutUniforme.nome}
                    className="w-20 h-20 object-cover rounded"
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-100 rounded flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-blue-300" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{checkoutUniforme.nome}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {parseFloat(checkoutUniforme.preco || "0").toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* Selecionar Aluno */}
              <div>
                <label className="text-sm font-medium">Para qual aluno?</label>
                <select 
                  className="w-full mt-1 p-2 border rounded-md"
                  value={checkoutData.alunoId}
                  onChange={(e) => setCheckoutData({...checkoutData, alunoId: parseInt(e.target.value)})}
                >
                  <option value={0}>Selecione o aluno</option>
                  {alunosDoResponsavel.map((aluno: any) => (
                    <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                  ))}
                </select>
              </div>

              {/* Tamanho */}
              {parseTamanhos(checkoutUniforme.tamanhos).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Tamanho</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {parseTamanhos(checkoutUniforme.tamanhos).map((tam: string) => (
                      <button
                        key={tam}
                        type="button"
                        className={`px-3 py-1 border rounded-md text-sm ${
                          checkoutData.tamanho === tam 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => setCheckoutData({...checkoutData, tamanho: tam})}
                      >
                        {tam}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cor */}
              {parseTamanhos(checkoutUniforme.cores).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {parseTamanhos(checkoutUniforme.cores).map((cor: string) => (
                      <button
                        key={cor.trim()}
                        type="button"
                        className={`px-3 py-1 border rounded-md text-sm ${
                          checkoutData.cor === cor.trim() 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => setCheckoutData({...checkoutData, cor: cor.trim()})}
                      >
                        {cor.trim()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantidade */}
              <div>
                <label className="text-sm font-medium">Quantidade</label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    className="w-8 h-8 border rounded-md flex items-center justify-center hover:bg-gray-50"
                    onClick={() => setCheckoutData({...checkoutData, quantidade: Math.max(1, checkoutData.quantidade - 1)})}
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{checkoutData.quantidade}</span>
                  <button
                    type="button"
                    className="w-8 h-8 border rounded-md flex items-center justify-center hover:bg-gray-50"
                    onClick={() => setCheckoutData({...checkoutData, quantidade: Math.min(10, checkoutData.quantidade + 1)})}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Informações do Uniforme */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-lg">{checkoutUniforme.nome}</h3>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                  <p>Tamanho: <span className="font-bold text-slate-900">{checkoutData.tamanho}</span></p>
                  <p>Quantidade: <span className="font-bold text-slate-900">{checkoutData.quantidade}</span></p>
                </div>
              </div>

              {/* Total */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {(parseFloat(checkoutUniforme.preco || "0") * checkoutData.quantidade).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Pagamento Transparente com Mercado Pago */}
              <div className="mt-4">
                <MercadoPagoBrick
                  amount={parseFloat(checkoutUniforme.preco || "0") * checkoutData.quantidade}
                  description={`${checkoutUniforme.nome} - Tam: ${checkoutData.tamanho} - Qtd: ${checkoutData.quantidade}`}
                  payerEmail={responsavel?.email || "contato@escolafutebol.com"}
                  tipo="uniforme"
                  alunoId={checkoutData.alunoId}
                  idItem={checkoutUniforme.id.toString()}
                  onSuccess={(paymentId) => {
                    setCheckoutUniforme(null);
                    queryClient.invalidateQueries({ queryKey: ["/api/compras-uniformes"] });
                  }}
                  onError={(error) => console.error(error)}
                />
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setCheckoutUniforme(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Checkout Mensalidade */}
      <Dialog open={!!checkoutMensalidade} onOpenChange={() => setCheckoutMensalidade(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pagar Mensalidade
            </DialogTitle>
          </DialogHeader>
          
          {checkoutMensalidade && (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-lg">{checkoutMensalidade.alunoNome}</h3>
                <p className="text-gray-600">Mensalidade: {checkoutMensalidade.mesNome}</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  R$ {parseFloat(checkoutMensalidade.valor).toFixed(2).replace('.', ',')}
                </p>
              </div>

              <MercadoPagoBrick
                amount={parseFloat(checkoutMensalidade.valor)}
                description={`Mensalidade ${checkoutMensalidade.mesNome} - ${checkoutMensalidade.alunoNome}`}
                payerEmail={responsavel?.email || "contato@escolafutebol.com"}
                tipo="mensalidade"
                alunoId={checkoutMensalidade.alunoId}
                mesReferencia={checkoutMensalidade.mesReferencia}
                onSuccess={(paymentId) => {
                  setCheckoutMensalidade(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/pagamentos"] });
                }}
                onError={(error) => console.error(error)}
              />
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setCheckoutMensalidade(null)}
              >
                Cancelar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Checkout Evento */}
      <Dialog open={!!checkoutEvento} onOpenChange={() => setCheckoutEvento(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Inscrição em Evento
            </DialogTitle>
          </DialogHeader>
          
          {checkoutEvento && (
            <div className="space-y-4">
              {/* Resumo do Evento */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-lg">{checkoutEvento.nome}</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {checkoutEvento.preco && parseFloat(checkoutEvento.preco) > 0 
                    ? `R$ ${parseFloat(checkoutEvento.preco).toFixed(2).replace('.', ',')}`
                    : 'Gratuito'
                  }
                </p>
              </div>

              {/* Seleção de Aluno */}
              <div>
                <label className="text-sm font-medium">Selecione o filho para inscrever:</label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {alunosDoResponsavel.map((aluno: any) => {
                    const jaInscrito = inscricoesEventos.some(
                      (i: any) => i.eventoId === checkoutEvento.id && i.alunoId === aluno.id
                    );
                    return (
                      <button
                        key={aluno.id}
                        type="button"
                        disabled={jaInscrito}
                        className={`p-3 border rounded-lg text-left transition-all ${
                          jaInscrito 
                            ? 'bg-green-50 border-green-300 cursor-not-allowed'
                            : checkoutData.alunoId === aluno.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => setCheckoutData({...checkoutData, alunoId: aluno.id})}
                      >
                        <span className="font-medium">{aluno.nome}</span>
                        {jaInscrito && <Badge className="ml-2 bg-green-500">✓ Inscrito</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pagamento */}
              {parseFloat(checkoutEvento.preco || "0") > 0 ? (
                <MercadoPagoBrick
                  amount={parseFloat(checkoutEvento.preco || "0")}
                  description={`Evento: ${checkoutEvento.nome}`}
                  payerEmail={responsavel?.email || "contato@escolafutebol.com"}
                  tipo="evento"
                  alunoId={checkoutData.alunoId}
                  idItem={checkoutEvento.id.toString()}
                  onSuccess={(paymentId) => {
                    setCheckoutEvento(null);
                    queryClient.invalidateQueries({ queryKey: ["/api/inscricoes-eventos"] });
                  }}
                  onError={(error) => {
                    console.error("Erro no checkout do evento:", error);
                  }}
                />
              ) : (
                <Button 
                  className="w-full bg-[#009ee3] hover:bg-[#007eb5] text-white"
                  disabled={!checkoutData.alunoId}
                  onClick={() => {
                    createPreferenceMutation.mutate({
                      tipo: 'evento',
                      alunoId: checkoutData.alunoId,
                      idItem: checkoutEvento.id,
                      valor: "0",
                      descricao: `Inscrição Gratuita: ${checkoutEvento.nome}`
                    });
                  }}
                >
                  Confirmar Inscrição Gratuita
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setCheckoutEvento(null)}
              >
                Cancelar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro/Edição de Aluno */}
      <Dialog open={showAlunoForm} onOpenChange={setShowAlunoForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAluno ? 'Editar Aluno' : 'Cadastrar Novo Filho'}
            </DialogTitle>
          </DialogHeader>
          <AlunoFormResponsavel 
            aluno={editingAluno} 
            onSuccess={() => {
              setShowAlunoForm(false);
              setEditingAluno(null);
            }}
            filiais={filiais || []}
            responsavelId={responsavel?.id}
            createMutation={createAlunoMutation}
            updateMutation={updateAlunoMutation}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}