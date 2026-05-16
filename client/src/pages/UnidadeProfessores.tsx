import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, ArrowLeft, GraduationCap, Building2 } from "lucide-react";
import { InterLogo } from "@/components/InterLogo";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProfessorForm from "@/components/forms/ProfessorForm";
import type { Professor, Filial, InsertProfessor } from "@shared/schema";

export default function UnidadeProfessores() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
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

  const { data: professores = [], isLoading } = useQuery<Professor[]>({
    queryKey: [`/api/filiais/${filialId}/professores`],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProfessor) => {
      return await apiRequest("POST", "/api/professores", {
        ...data,
        filialId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/professores`] });
      queryClient.invalidateQueries({ queryKey: ["/api/professores"] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Professor cadastrado e sincronizado com a matriz!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar professor: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertProfessor) => {
      if (!editingProfessor) return;
      return await apiRequest("PUT", `/api/professores/${editingProfessor.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/professores`] });
      queryClient.invalidateQueries({ queryKey: ["/api/professores"] });
      setEditingProfessor(null);
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Professor atualizado e sincronizado com a matriz!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar professor: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/professores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/professores`] });
      queryClient.invalidateQueries({ queryKey: ["/api/professores"] });
      toast({
        title: "Sucesso",
        description: "Professor removido e sincronizado com a matriz!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover professor: " + error.message,
        variant: "destructive",
      });
    },
  });

  const filteredProfessores = professores.filter(professor =>
    professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.cpf?.includes(searchTerm) ||
    professor.especialidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (data: InsertProfessor) => {
    if (editingProfessor) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (professor: Professor) => {
    setEditingProfessor(professor);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProfessor(null);
    setDialogOpen(true);
  };

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
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center p-0.5">
                  <InterLogo size={14} />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Gestão de Professores</h1>
                  <p className="text-sm text-muted-foreground">
                    {filial?.nome} - {professores.length} professores cadastrados
                  </p>
                </div>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Professor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProfessor ? "Editar Professor" : "Novo Professor"}
                  </DialogTitle>
                </DialogHeader>
                <ProfessorForm
                  professor={editingProfessor}
                  onSuccess={() => {
                    setDialogOpen(false);
                    setEditingProfessor(null);
                    queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/professores`] });
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
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">
                    Sistema Sincronizado com a Matriz
                  </h3>
                  <p className="text-green-800 text-sm">
                    Todos os professores cadastrados são automaticamente enviados para o sistema central.
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
              placeholder="Buscar por nome, email, CPF ou especialidade..."
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
        ) : filteredProfessores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum professor encontrado" : "Nenhum professor cadastrado"}
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                {searchTerm 
                  ? "Tente ajustar os termos de busca" 
                  : "Comece cadastrando o primeiro professor da unidade"
                }
              </p>
              {!searchTerm && (
                <Button onClick={openCreateDialog} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeiro Professor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfessores.map((professor) => (
              <Card key={professor.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{professor.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">{professor.email}</p>
                    </div>
                    {professor.ativo ? (
                      <Badge variant="default">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPF:</span>
                      <span>{professor.cpf || "Não informado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span>{professor.telefone || "Não informado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Especialidade:</span>
                      <span>{professor.especialidade || "Não informado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data de Admissão:</span>
                      <span>
                        {professor.dataAdmissao 
                          ? new Date(professor.dataAdmissao).toLocaleDateString('pt-BR')
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
                      onClick={() => openEditDialog(professor)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
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
                            Tem certeza que deseja excluir o professor <strong>{professor.nome}</strong>? 
                            Esta ação será sincronizada com a matriz e não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(professor.id)}
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