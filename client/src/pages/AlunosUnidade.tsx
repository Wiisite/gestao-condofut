import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Search, Edit, Trash2, Phone, Mail, Calendar, ArrowLeft, Building2, Receipt, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { AlunoWithFilial } from "@shared/schema";
import AlunoForm from "@/components/forms/AlunoForm";

interface UnidadeSession {
  gestorId: number;
  filialId: number;
  nomeGestor: string;
  nomeFilial: string;
  loginTime: string;
}

export default function AlunosUnidade() {
  const [match, params] = useRoute("/unidade/:filialId/alunos");
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<UnidadeSession | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [pagamentoFilter, setPagamentoFilter] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<AlunoWithFilial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const sessionData = localStorage.getItem('unidadeSession');
    if (sessionData) {
      const parsedSession = JSON.parse(sessionData);
      setSession(parsedSession);
      
      if (params?.filialId && parseInt(params.filialId) !== parsedSession.filialId) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta unidade",
          variant: "destructive",
        });
        setLocation("/portal-unidade");
        return;
      }
    } else {
      setLocation("/portal-unidade");
    }
  }, [params, setLocation, toast]);

  const { data: alunos, isLoading } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/unidade/alunos", session?.filialId],
    enabled: !!session?.filialId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/alunos/${id}`);
      if (!response.ok) {
        throw new Error("Erro ao deletar aluno");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unidade/alunos", session?.filialId] });
      toast({
        title: "Aluno deletado",
        description: "Aluno foi removido com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao deletar aluno",
        variant: "destructive",
      });
    },
  });

  const handleEditAluno = (aluno: AlunoWithFilial) => {
    setEditingAluno(aluno);
    setIsDialogOpen(true);
  };

  const handleDeleteAluno = (id: number) => {
    if (window.confirm("Tem certeza que deseja deletar este aluno?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAluno(null);
    queryClient.invalidateQueries({ queryKey: ["/api/unidade/alunos", session?.filialId] });
  };

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const getStatusPagamento = (aluno: AlunoWithFilial) => {
    // Implementar lógica de status de pagamento baseada nos pagamentos do aluno
    const agora = new Date();
    const mesAtual = agora.getFullYear() + "-" + String(agora.getMonth() + 1).padStart(2, '0');
    
    // Por enquanto, retornar um status simulado
    return Math.random() > 0.3 ? "em_dia" : "atrasado";
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "em_dia":
        return "default";
      case "atrasado":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Filtrar alunos
  const alunosFiltrados = alunos?.filter((aluno) => {
    const matchesSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.cpf?.includes(searchTerm) ||
                         aluno.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || aluno.ativo === (statusFilter === "ativo");
    
    const statusPag = getStatusPagamento(aluno);
    const matchesPagamento = pagamentoFilter === "todos" || statusPag === pagamentoFilter;
    
    return matchesSearch && matchesStatus && matchesPagamento;
  }) || [];

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/unidade/${session.filialId}/dashboard`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gestão de Alunos</h1>
                <p className="text-sm text-gray-600">{session.nomeFilial}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Alunos da Unidade</h2>
            <p className="text-gray-600">
              {alunosFiltrados.length} {alunosFiltrados.length === 1 ? 'aluno encontrado' : 'alunos encontrados'}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAluno ? "Editar Aluno" : "Cadastrar Novo Aluno"}
                </DialogTitle>
              </DialogHeader>
              <AlunoForm 
                aluno={editingAluno} 
                onSuccess={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={pagamentoFilter} onValueChange={setPagamentoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Pagamentos</SelectItem>
                  <SelectItem value="em_dia">Em Dia</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Lista de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : alunosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum aluno encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== "todos" || pagamentoFilter !== "todos"
                    ? "Tente ajustar os filtros de busca."
                    : "Cadastre o primeiro aluno da sua unidade."}
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunosFiltrados.map((aluno) => (
                      <TableRow key={aluno.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {aluno.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{aluno.nome}</div>
                              <div className="text-sm text-gray-600">{aluno.cpf}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {aluno.dataNascimento ? (
                            <span className="text-sm text-gray-900">
                              {calcularIdade(aluno.dataNascimento)} anos
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {aluno.telefone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-3 h-3 mr-1" />
                                {aluno.telefone}
                              </div>
                            )}
                            {aluno.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-3 h-3 mr-1" />
                                {aluno.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={aluno.ativo ? "default" : "secondary"}>
                            {aluno.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(getStatusPagamento(aluno))}>
                            {getStatusPagamento(aluno) === "em_dia" ? "Em Dia" : "Atrasado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {aluno.dataMatricula && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(aluno.dataMatricula), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAluno(aluno)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAluno(aluno.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}