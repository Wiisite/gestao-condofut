import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Edit, Trash2, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUnidadeAuth } from "@/contexts/UnidadeContext";
import type { TurmaWithProfessor } from "@shared/schema";

export default function TurmasTab() {
  const { filialId } = useUnidadeAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<TurmaWithProfessor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: turmas, isLoading } = useQuery({
    queryKey: ["/api/turmas"],
    enabled: !!filialId,
  });

  const deleteTurmaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/turmas/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete turma");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turmas"] });
      toast({
        title: "Turma excluída",
        description: "A turma foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a turma.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTurma = (id: number) => {
    if (confirm("Tem certeza de que deseja excluir esta turma?")) {
      deleteTurmaMutation.mutate(id);
    }
  };

  const handleEditTurma = (turma: TurmaWithProfessor) => {
    setEditingTurma(turma);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTurma(null);
  };

  const turmasArray = Array.isArray(turmas) ? turmas : [];

  const filteredTurmas = turmasArray.filter((turma) => {
    return turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
           turma.modalidade?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turmas da Unidade</CardTitle>
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
          <h2 className="text-2xl font-bold text-gray-900">Turmas da Unidade</h2>
          <p className="text-gray-600">Gerencie as turmas da sua unidade</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTurma ? "Editar Turma" : "Cadastrar Nova Turma"}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-center text-gray-600">
                Formulário de turma será implementado em breve.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleCloseDialog}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou modalidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTurmas.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {turmasArray.length === 0 ? "Nenhuma turma cadastrada" : "Nenhuma turma encontrada"}
              </h3>
              <p className="text-gray-600 mb-4">
                {turmasArray.length === 0 
                  ? "Comece cadastrando a primeira turma da sua unidade."
                  : "Tente buscar por outros termos."
                }
              </p>
              {turmasArray.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Cadastrar Primeira Turma
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurmas.map((turma) => (
                    <TableRow key={turma.id}>
                      <TableCell>
                        <div className="font-medium">{turma.nome}</div>
                      </TableCell>
                      <TableCell>
                        {turma.modalidade || "Não informado"}
                      </TableCell>
                      <TableCell>
                        {turma.professor?.nome || "Não atribuído"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3" />
                          {turma.horario || "Não definido"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-3 h-3" />
                          {turma.capacidade || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={turma.ativo ? "default" : "secondary"}>
                          {turma.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTurma(turma)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTurma(turma.id)}
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