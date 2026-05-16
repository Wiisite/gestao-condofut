import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, User, ArrowLeft, Eye, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AlunoForm from "@/components/forms/AlunoForm";
import ExtratoAluno from "@/components/ExtratoAluno";
import type { AlunoWithFilial, Filial, InsertAluno } from "@shared/schema";

export default function UnidadeAlunos() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAluno, setSelectedAluno] = useState<AlunoWithFilial | null>(null);
  const [viewingExtrato, setViewingExtrato] = useState<AlunoWithFilial | null>(null);
  const [editingAluno, setEditingAluno] = useState<AlunoWithFilial | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Recuperar unidade selecionada
  const unidadeSelecionada = localStorage.getItem("unidade_selecionada");
  const filialId = unidadeSelecionada ? parseInt(unidadeSelecionada) : null;

  if (!filialId) {
    setLocation("/login-unidade");
    return null;
  }

  const { data: filial } = useQuery<Filial>({
    queryKey: [`/api/filiais/${filialId}`],
  });

  const { data: alunos = [], isLoading } = useQuery<AlunoWithFilial[]>({
    queryKey: [`/api/filiais/${filialId}/alunos`],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAluno) => {
      return await apiRequest("POST", "/api/alunos", {
        ...data,
        filialId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/alunos`] });
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] }); // Sincroniza com matriz
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Aluno cadastrado e sincronizado com a matriz!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar aluno: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertAluno) => {
      if (!editingAluno) return;
      return await apiRequest("PUT", `/api/alunos/${editingAluno.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/alunos`] });
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] }); // Sincroniza com matriz
      setEditingAluno(null);
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Aluno atualizado e sincronizado com a matriz!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar aluno: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/alunos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/alunos`] });
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] }); // Sincroniza com matriz
      toast({
        title: "Sucesso",
        description: "Aluno removido e sincronizado com a matriz!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover aluno: " + error.message,
        variant: "destructive",
      });
    },
  });

  const filteredAlunos = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.cpf?.includes(searchTerm)
  );

  const handleSubmit = (data: InsertAluno) => {
    if (editingAluno) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (aluno: AlunoWithFilial) => {
    setEditingAluno(aluno);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAluno(null);
    setDialogOpen(true);
  };

  if (viewingExtrato) {
    return (
      <ExtratoAluno 
        aluno={viewingExtrato} 
        onBack={() => setViewingExtrato(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/unidade/sistema")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Sistema
              </Button>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold">Gestão de Alunos</h1>
                  <p className="text-sm text-muted-foreground">
                    {filial?.nome} - {alunos.length} alunos cadastrados
                  </p>
                </div>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Aluno
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAluno ? "Editar Aluno" : "Novo Aluno"}
                  </DialogTitle>
                </DialogHeader>
                <AlunoForm
                  aluno={editingAluno}
                  onSuccess={() => {
                    setDialogOpen(false);
                    setEditingAluno(null);
                    queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/alunos`] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações da Unidade */}
        <div className="mb-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Sistema Sincronizado com a Matriz
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Todos os alunos cadastrados são automaticamente enviados para o sistema central.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAlunos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                {searchTerm 
                  ? "Tente ajustar os termos de busca" 
                  : "Comece cadastrando o primeiro aluno da unidade"
                }
              </p>
              {!searchTerm && (
                <Button onClick={openCreateDialog} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeiro Aluno
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlunos.map((aluno) => (
              <Card key={aluno.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{aluno.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">{aluno.email}</p>
                    </div>
                    {aluno.statusPagamento && (
                      <Badge variant={aluno.statusPagamento.emDia ? "default" : "destructive"}>
                        {aluno.statusPagamento.emDia ? "Em dia" : `${aluno.statusPagamento.diasAtraso} dias`}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPF:</span>
                      <span>{aluno.cpf || "Não informado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span>{aluno.telefone || "Não informado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data de Nascimento:</span>
                      <span>
                        {aluno.dataNascimento 
                          ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR')
                          : "Não informado"
                        }
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingExtrato(aluno)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Extrato
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(aluno)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o aluno <strong>{aluno.nome}</strong>? 
                            Esta ação será sincronizada com a matriz e não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(aluno.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}