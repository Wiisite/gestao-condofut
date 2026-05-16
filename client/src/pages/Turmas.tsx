import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Edit, Trash2, Clock, DollarSign, SquareUser, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TurmaWithProfessor } from "@shared/schema";
import TurmaForm from "@/components/forms/TurmaForm";

export default function Turmas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<TurmaWithProfessor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: turmas, isLoading } = useQuery<TurmaWithProfessor[]>({
    queryKey: ["/api/turmas"],
  });

  const deleteTurmaMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/turmas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turmas"] });
      toast({
        title: "Sucesso",
        description: "Turma removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover turma. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredTurmas = turmas?.filter((turma) =>
    turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.professor?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (turma: TurmaWithProfessor) => {
    setEditingTurma(turma);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta turma?")) {
      deleteTurmaMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTurma(null);
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const getCategoryColor = (categoria: string) => {
    const colors = {
      "Infantil": "bg-blue-100 text-blue-800",
      "Juvenil": "bg-green-100 text-green-800",
      "Adulto": "bg-purple-100 text-purple-800",
    };
    return colors[categoria as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Gestão de Turmas</h2>
          <p className="text-neutral-600">Cadastre e gerencie as turmas da escola</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Users className="w-4 h-4 mr-2" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTurma ? "Editar Turma" : "Cadastrar Nova Turma"}
              </DialogTitle>
            </DialogHeader>
            <TurmaForm 
              turma={editingTurma} 
              onSuccess={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Buscar turmas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <p className="font-semibold text-lg">{filteredTurmas.length}</p>
                <p className="text-neutral-500">Total</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-green-600">
                  {filteredTurmas.filter(t => t.ativo).length}
                </p>
                <p className="text-neutral-500">Ativas</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-blue-600">
                  {filteredTurmas.reduce((total, turma) => total + (turma._count?.matriculas || 0), 0)}
                </p>
                <p className="text-neutral-500">Alunos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Turmas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Turmas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredTurmas.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">
                {searchTerm ? "Nenhuma turma encontrada" : "Nenhuma turma cadastrada"}
              </h3>
              <p className="text-neutral-500 mb-4">
                {searchTerm 
                  ? "Tente buscar com outros termos." 
                  : "Comece cadastrando a primeira turma da escola."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Cadastrar Primeira Turma
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>Alunos</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurmas.map((turma) => (
                    <TableRow key={turma.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{turma.nome}</p>
                          <Badge className={getCategoryColor(turma.categoria)}>
                            {turma.categoria}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {turma.professor ? (
                          <div className="flex items-center">
                            <SquareUser className="w-4 h-4 mr-2 text-neutral-400" />
                            <span>{turma.professor.nome}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">Sem professor</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {turma.filial ? (
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-neutral-400" />
                            <span>{turma.filial.nome}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">Sem filial</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-neutral-400" />
                          <span>{turma._count?.matriculas || 0} / {turma.capacidadeMaxima}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {turma.horario && (
                            <div className="flex items-center text-sm">
                              <Clock className="w-3 h-3 mr-1 text-neutral-400" />
                              {turma.horario}
                            </div>
                          )}
                          {turma.diasSemana && (
                            <p className="text-xs text-neutral-500">{turma.diasSemana}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1 text-neutral-400" />
                          <span className="font-medium">
                            {turma._count?.matriculas || 0} / {turma.capacidadeMaxima || "∞"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={turma.ativo ? "default" : "secondary"}>
                          {turma.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(turma)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(turma.id)}
                            disabled={deleteTurmaMutation.isPending}
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
