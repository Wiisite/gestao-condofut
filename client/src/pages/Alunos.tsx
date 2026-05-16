import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Search, Edit, Trash2, Phone, Mail, Calendar, Building2, Receipt, Filter } from "lucide-react";
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
  const [viewingExtrato, setViewingExtrato] = useState<AlunoWithFilial | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setLocation("/cadastro-aluno")}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Cadastrar
        </Button>
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
          <CardTitle>Lista de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredAlunos.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">
                {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              </h3>
              <p className="text-neutral-500 mb-4">
                {searchTerm 
                  ? "Tente buscar com outros termos." 
                  : "Comece cadastrando o primeiro aluno da escola."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{aluno.nome}</p>
                          {aluno.dataNascimento && (
                            <p className="text-sm text-neutral-500">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {format(new Date(aluno.dataNascimento), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {aluno.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1 text-neutral-400" />
                              {aluno.email}
                            </div>
                          )}
                          {aluno.telefone && (
                            <div className="flex items-center text-sm">
                              <Phone className="w-3 h-3 mr-1 text-neutral-400" />
                              {aluno.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {aluno.filial ? (
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-neutral-400" />
                            <span>{aluno.filial.nome}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">Sem unidade</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {calculateAge(aluno.dataNascimento)} anos
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {aluno.nomeResponsavel ? (
                            <>
                              <p className="font-medium text-sm">{aluno.nomeResponsavel}</p>
                              {aluno.telefoneResponsavel && (
                                <div className="flex items-center text-xs text-neutral-500">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {aluno.telefoneResponsavel}
                                </div>
                              )}
                              {(aluno as any).responsavel?.email && (
                                <div className="flex items-center text-xs text-neutral-500">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {(aluno as any).responsavel.email}
                                </div>
                              )}
                              {aluno.responsavelId && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Portal Ativo
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-neutral-400 text-sm">Sem responsável</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {aluno.statusPagamento ? (
                          <div className="space-y-1">
                            <Badge 
                              variant={aluno.statusPagamento.emDia ? "default" : "destructive"}
                              className={aluno.statusPagamento.emDia ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {aluno.statusPagamento.emDia ? "Em Dia" : "Atrasado"}
                            </Badge>
                            {!aluno.statusPagamento.emDia && (
                              <div className="text-xs text-red-600">
                                {aluno.statusPagamento.diasAtraso !== undefined 
                                  ? `${aluno.statusPagamento.diasAtraso} dias`
                                  : "Sem pagamentos"
                                }
                              </div>
                            )}
                            {aluno.statusPagamento.ultimoPagamento && (
                              <div className="text-xs text-neutral-500">
                                Último: {aluno.statusPagamento.ultimoPagamento}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary">
                            Sem dados
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={aluno.ativo ? "default" : "secondary"}>
                          {aluno.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewExtrato(aluno)}
                            title="Ver extrato de pagamentos"
                          >
                            <Receipt className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(aluno)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(aluno.id)}
                            disabled={deleteAlunoMutation.isPending}
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
  );
}
