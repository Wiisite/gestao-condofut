import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Search, Edit, Trash2, Phone, Mail, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUnidadeAuth } from "@/contexts/UnidadeContext";
import type { Professor } from "@shared/schema";

export default function ProfessoresTab() {
  const { filialId } = useUnidadeAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: professores, isLoading } = useQuery({
    queryKey: ["/api/professores"],
    enabled: !!filialId,
  });

  const deleteProfessorMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/professores/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete professor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professores"] });
      toast({
        title: "Professor excluído",
        description: "O professor foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o professor.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProfessor = (id: number) => {
    if (confirm("Tem certeza de que deseja excluir este professor?")) {
      deleteProfessorMutation.mutate(id);
    }
  };

  const handleEditProfessor = (professor: Professor) => {
    setEditingProfessor(professor);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfessor(null);
  };

  const professoresArray = Array.isArray(professores) ? professores : [];

  const filteredProfessores = professoresArray.filter((professor) => {
    return professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
           professor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           professor.telefone?.includes(searchTerm);
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Professores da Unidade</CardTitle>
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
          <h2 className="text-2xl font-bold text-gray-900">Professores da Unidade</h2>
          <p className="text-gray-600">Gerencie os professores da sua unidade</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProfessor ? "Editar Professor" : "Cadastrar Novo Professor"}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-center text-gray-600">
                Formulário de professor será implementado em breve.
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
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProfessores.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {professoresArray.length === 0 ? "Nenhum professor cadastrado" : "Nenhum professor encontrado"}
              </h3>
              <p className="text-gray-600 mb-4">
                {professoresArray.length === 0 
                  ? "Comece cadastrando o primeiro professor da sua unidade."
                  : "Tente buscar por outros termos."
                }
              </p>
              {professoresArray.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Professor
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
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessores.map((professor) => (
                    <TableRow key={professor.id}>
                      <TableCell>
                        <div className="font-medium">{professor.nome}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {professor.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              {professor.email}
                            </div>
                          )}
                          {professor.telefone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {professor.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {professor.especialidade || "Não informado"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={professor.ativo ? "default" : "secondary"}>
                          {professor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProfessor(professor)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProfessor(professor.id)}
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