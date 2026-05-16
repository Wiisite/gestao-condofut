import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, ArrowLeft, Users, Calendar, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TurmaForm from "@/components/forms/TurmaForm";
import type { TurmaWithProfessor, Filial, InsertTurma } from "@shared/schema";

export default function TurmasUnidade() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTurma, setEditingTurma] = useState<TurmaWithProfessor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const { data: turmas = [], isLoading } = useQuery<TurmaWithProfessor[]>({
    queryKey: [`/api/filiais/${filialId}/turmas`],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTurma) => {
      return await apiRequest("POST", "/api/turmas", {
        ...data,
        filialId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/turmas`] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Turma criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar turma: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertTurma) => {
      if (!editingTurma) return;
      return await apiRequest("PUT", `/api/turmas/${editingTurma.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/turmas`] });
      setEditingTurma(null);
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Turma atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar turma: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/turmas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/turmas`] });
      toast({
        title: "Sucesso",
        description: "Turma removida com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover turma: " + error.message,
        variant: "destructive",
      });
    },
  });

  const filteredTurmas = turmas.filter(turma =>
    turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.professor?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (data: InsertTurma) => {
    if (editingTurma) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (turma: TurmaWithProfessor) => {
    setEditingTurma(turma);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTurma(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/painel-unidade")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Painel
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Turmas</h1>
            <p className="text-muted-foreground">
              {filial?.nome} - {turmas.length} turmas ativas
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTurma ? "Editar Turma" : "Nova Turma"}
              </DialogTitle>
            </DialogHeader>
            <TurmaForm
              turma={editingTurma}
              onSuccess={() => {
                setDialogOpen(false);
                setEditingTurma(null);
                queryClient.invalidateQueries({ queryKey: [`/api/filiais/${filialId}/turmas`] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, categoria ou professor..."
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
      ) : filteredTurmas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhuma turma encontrada" : "Nenhuma turma cadastrada"}
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchTerm 
                ? "Tente ajustar os termos de busca" 
                : "Comece criando a primeira turma da unidade"
              }
            </p>
            {!searchTerm && (
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeira Turma
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTurmas.map((turma) => (
            <Card key={turma.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{turma.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">{turma.categoria}</p>
                  </div>
                  <Badge variant={turma.ativo ? "default" : "secondary"}>
                    {turma.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Professor:</span>
                    <span>{turma.professor?.nome || "Não atribuído"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Dias:</span>
                    <span>{turma.diasSemana || "Não definido"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Horário:</span>
                    <span>{turma.horario || "Não definido"}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vagas:</span>
                    <span>
                      {turma._count?.matriculas || 0} / {turma.capacidadeMaxima || "∞"}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(turma)}
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
                          Tem certeza que deseja excluir a turma <strong>{turma.nome}</strong>? 
                          Esta ação não pode ser desfeita e afetará todos os alunos matriculados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(turma.id)}
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
  );
}