import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Search, Edit, Trash2, Phone, Mail, Calendar, Users, Building2, Receipt, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { AlunoWithFilial, Filial } from "@shared/schema";
import AlunoForm from "@/components/forms/AlunoForm";
import ExtratoAluno from "@/components/ExtratoAluno";

export default function Alunos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [unidadeFilter, setUnidadeFilter] = useState<string>("todas");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [pagamentoFilter, setPagamentoFilter] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<AlunoWithFilial | null>(null);
  const [viewingAluno, setViewingAluno] = useState<AlunoWithFilial | null>(null);
  const [viewingExtrato, setViewingExtrato] = useState<AlunoWithFilial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: alunos, isLoading } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/alunos"],
  });

  const { data: filiais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const deleteAlunoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/alunos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      toast({
        title: "Sucesso",
        description: "Aluno removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover aluno. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (aluno: AlunoWithFilial) => {
    setEditingAluno(aluno);
    setIsDialogOpen(true);
  };

  const handleView = (aluno: AlunoWithFilial) => {
    setViewingAluno(aluno);
  };

  const handleViewExtrato = (aluno: AlunoWithFilial) => {
    setViewingExtrato(aluno);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este aluno?")) {
      deleteAlunoMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAluno(null);
  };



  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  // Função para filtrar alunos
  const filteredAlunos = alunos?.filter((aluno) => {
    // Filtro por nome
    const matchesSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por unidade
    const matchesUnidade = unidadeFilter === "todas" || 
                          (unidadeFilter === "sem-unidade" && !aluno.filialId) ||
                          aluno.filialId?.toString() === unidadeFilter;

    // Filtro por status ativo/passivo
    const matchesStatus = statusFilter === "todos" ||
                         (statusFilter === "ativo" && aluno.ativo) ||
                         (statusFilter === "inativo" && !aluno.ativo);

    // Filtro por status de pagamento
    const matchesPagamento = pagamentoFilter === "todos" ||
                            (pagamentoFilter === "em-dia" && aluno.statusPagamento?.emDia) ||
                            (pagamentoFilter === "atrasado" && !aluno.statusPagamento?.emDia);

    return matchesSearch && matchesUnidade && matchesStatus && matchesPagamento;
  }) || [];

  // Se estiver visualizando extrato, mostrar o componente de extrato
  if (viewingExtrato) {
    return (
      <ExtratoAluno 
        aluno={viewingExtrato} 
        onBack={() => setViewingExtrato(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Gestão de Alunos</h2>
          <p className="text-neutral-600">Cadastre e gerencie os alunos da escola</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => navigate("/cadastro-aluno")}
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Cadastrar Aluno
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Aluno</DialogTitle>
              </DialogHeader>
              <AlunoForm 
                aluno={editingAluno} 
                onSuccess={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Buscar alunos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <p className="font-semibold text-lg">{filteredAlunos.length}</p>
                <p className="text-neutral-500">Total</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-green-600">
                  {filteredAlunos.filter(a => a.ativo).length}
                </p>
                <p className="text-neutral-500">Ativos</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-green-600">
                  {filteredAlunos.filter(a => a.statusPagamento?.emDia).length}
                </p>
                <p className="text-neutral-500">Em Dia</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-red-600">
                  {filteredAlunos.filter(a => a.statusPagamento && !a.statusPagamento.emDia).length}
                </p>
                <p className="text-neutral-500">Atrasados</p>
              </div>
            </div>
          </div>

          {/* Filtros Avançados */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Filtros:</span>
            </div>
            
            {/* Filtro por Unidade */}
            <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas as unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as unidades</SelectItem>
                <SelectItem value="sem-unidade">Sem unidade</SelectItem>
                {filiais?.map((filial) => (
                  <SelectItem key={filial.id} value={filial.id.toString()}>
                    {filial.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por Pagamento */}
            <Select value={pagamentoFilter} onValueChange={setPagamentoFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos pagamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="em-dia">Em dia</SelectItem>
                <SelectItem value="atrasado">Atrasados</SelectItem>
              </SelectContent>
            </Select>

            {/* Botão para limpar filtros */}
            {(unidadeFilter !== "todas" || statusFilter !== "todos" || pagamentoFilter !== "todos") && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setUnidadeFilter("todas");
                  setStatusFilter("todos");
                  setPagamentoFilter("todos");
                }}
                className="text-neutral-500 hover:text-neutral-700"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alunos Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Alunos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredAlunos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500">Nenhum aluno encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlunos.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
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
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100">⬇</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Foto</span>
                          </div>
                        )}
                        <div>
                          <p 
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            onClick={() => handleView(aluno)}
                          >
                            {aluno.nome}
                          </p>
                          {aluno.email && (
                            <p className="text-sm text-neutral-500">{aluno.email}</p>
                          )}
                          {aluno.telefone && (
                            <div className="flex items-center space-x-1 text-sm text-neutral-500">
                              <Phone className="w-3 h-3" />
                              <span>{aluno.telefone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {aluno.cpf || "Não informado"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span>{calculateAge(aluno.dataNascimento)} anos</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-neutral-400" />
                        <span>{aluno.filial?.nome || "Não informada"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {aluno.dataMatricula ? 
                          format(new Date(aluno.dataMatricula), "dd/MM/yyyy", { locale: ptBR }) :
                          "Não informada"
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={aluno.ativo ? "default" : "secondary"}>
                        {aluno.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {aluno.statusPagamento ? (
                        <Badge 
                          variant={aluno.statusPagamento.emDia ? "default" : "destructive"}
                        >
                          {aluno.statusPagamento.emDia ? "Em dia" : 
                           `${aluno.statusPagamento.diasAtraso || 0} dias atraso`}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sem dados</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {aluno.nomeResponsavel ? (
                          <>
                            <p className="font-medium text-sm">{aluno.nomeResponsavel}</p>
                            {aluno.telefoneResponsavel && (
                              <div className="flex items-center space-x-1 text-xs text-neutral-500">
                                <Phone className="w-3 h-3" />
                                <span>{aluno.telefoneResponsavel}</span>
                              </div>
                            )}
                            {aluno.responsavelId && (
                              <Badge variant="outline" className="text-xs">
                                Portal Ativo
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-neutral-400 text-sm">Sem responsável</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewExtrato(aluno)}
                        >
                          <Receipt className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(aluno)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(aluno.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Dialog de Visualização do Aluno (Somente Leitura) */}
      <Dialog open={!!viewingAluno} onOpenChange={() => setViewingAluno(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewingAluno?.fotoUrl ? (
                <img 
                  src={viewingAluno.fotoUrl} 
                  alt={viewingAluno.nome}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <span>{viewingAluno?.nome}</span>
                <p className="text-sm font-normal text-gray-500">Ficha do Aluno</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {viewingAluno && (
            <div className="space-y-6 py-4">
              {/* Dados Pessoais */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nome:</span>
                    <p className="font-medium">{viewingAluno.nome}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">CPF:</span>
                    <p className="font-medium">{viewingAluno.cpf || "Não informado"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{viewingAluno.email || "Não informado"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Telefone:</span>
                    <p className="font-medium">{viewingAluno.telefone || "Não informado"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Data de Nascimento:</span>
                    <p className="font-medium">
                      {viewingAluno.dataNascimento 
                        ? format(new Date(viewingAluno.dataNascimento), "dd/MM/yyyy", { locale: ptBR })
                        : "Não informada"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Idade:</span>
                    <p className="font-medium">{calculateAge(viewingAluno.dataNascimento)} anos</p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Endereço</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <span className="text-gray-500">Endereço:</span>
                    <p className="font-medium">{viewingAluno.endereco || "Não informado"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Bairro:</span>
                    <p className="font-medium">{viewingAluno.bairro || "Não informado"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">CEP:</span>
                    <p className="font-medium">{viewingAluno.cep || "Não informado"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Cidade:</span>
                    <p className="font-medium">{viewingAluno.cidade || "Não informada"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Estado:</span>
                    <p className="font-medium">{viewingAluno.estado || "Não informado"}</p>
                  </div>
                </div>
              </div>

              {/* Dados da Matrícula */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Dados da Matrícula</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Unidade:</span>
                    <p className="font-medium">{viewingAluno.filial?.nome || "Não informada"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Data de Matrícula:</span>
                    <p className="font-medium">
                      {viewingAluno.dataMatricula 
                        ? format(new Date(viewingAluno.dataMatricula), "dd/MM/yyyy", { locale: ptBR })
                        : "Não informada"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge variant={viewingAluno.ativo ? "default" : "secondary"}>
                      {viewingAluno.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">Pagamento:</span>
                    {viewingAluno.statusPagamento ? (
                      <Badge variant={viewingAluno.statusPagamento.emDia ? "default" : "destructive"}>
                        {viewingAluno.statusPagamento.emDia ? "Em dia" : `${viewingAluno.statusPagamento.diasAtraso || 0} dias atraso`}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Sem dados</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados do Responsável */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                  Dados do Responsável
                  {viewingAluno.responsavelId && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Portal Ativo</span>
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nome:</span>
                    <p className="font-medium">{viewingAluno.nomeResponsavel || "Não informado"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Telefone:</span>
                    <p className="font-medium">{viewingAluno.telefoneResponsavel || "Não informado"}</p>
                  </div>
                </div>
              </div>

              {/* Botão de Editar */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingAluno(null)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  setViewingAluno(null);
                  handleEdit(viewingAluno);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Aluno
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}