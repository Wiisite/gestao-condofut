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
import { UserPlus, Search, Trash2, Phone, Mail, Calendar, Filter, Eye, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useUnidadeAuth } from "@/contexts/UnidadeContext";
import type { AlunoWithFilial } from "@shared/schema";

export default function AlunosTab() {
  const { filialId } = useUnidadeAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [pagamentoFilter, setPagamentoFilter] = useState<string>("todos");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alunos, isLoading } = useQuery({
    queryKey: ["/api/alunos"],
    enabled: !!filialId,
  });

  const deleteAlunoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/alunos/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete aluno");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      toast({
        title: "Aluno excluído",
        description: "O aluno foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o aluno.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAluno = (id: number) => {
    if (confirm("Tem certeza de que deseja excluir este aluno?")) {
      deleteAlunoMutation.mutate(id);
    }
  };



  const alunosArray = Array.isArray(alunos) ? alunos : [];

  const filteredAlunos = alunosArray.filter((aluno) => {
    const matchesSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.telefone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "todos" || 
                         (statusFilter === "ativo" && aluno.ativo) ||
                         (statusFilter === "inativo" && !aluno.ativo);
    
    const matchesPagamento = pagamentoFilter === "todos" ||
                           (pagamentoFilter === "em_dia" && aluno.statusPagamento === "em_dia") ||
                           (pagamentoFilter === "pendente" && aluno.statusPagamento === "pendente") ||
                           (pagamentoFilter === "atrasado" && aluno.statusPagamento === "atrasado");
    
    return matchesSearch && matchesStatus && matchesPagamento;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alunos da Unidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alunos da Unidade</h2>
          <p className="text-gray-600">Gerencie os alunos matriculados na sua unidade</p>
        </div>
        <Button 
          onClick={() => setLocation('/unidade/cadastro-aluno')}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {alunosArray.length === 0 ? "Cadastrar Primeiro Aluno" : "Novo Aluno"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={pagamentoFilter} onValueChange={setPagamentoFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="em_dia">Em dia</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAlunos.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {alunosArray.length === 0 ? "Nenhum aluno cadastrado" : "Nenhum aluno encontrado"}
              </h3>
              <p className="text-gray-600 mb-4">
                {alunosArray.length === 0 
                  ? "Comece cadastrando o primeiro aluno da sua unidade."
                  : "Tente ajustar os filtros ou buscar por outros termos."
                }
              </p>
              {alunosArray.length === 0 && (
                <Button onClick={() => setLocation('/unidade/cadastro-aluno')}>
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
                    <TableHead>Data de Nascimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{aluno.nome}</div>
                          {aluno.nomeResponsavel && (
                            <div className="text-sm text-gray-500">
                              Responsável: {aluno.nomeResponsavel}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {aluno.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              {aluno.email}
                            </div>
                          )}
                          {aluno.telefone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {aluno.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {aluno.dataNascimento && (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(aluno.dataNascimento), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={aluno.ativo ? "default" : "secondary"}>
                          {aluno.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            aluno.statusPagamento === "em_dia" ? "default" :
                            aluno.statusPagamento === "pendente" ? "secondary" :
                            "destructive"
                          }
                        >
                          {aluno.statusPagamento === "em_dia" ? "Em dia" :
                           aluno.statusPagamento === "pendente" ? "Pendente" :
                           "Atrasado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/unidade/cadastro-aluno?edit=${aluno.id}`)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAluno(aluno.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
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