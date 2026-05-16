import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SquareUser, Search, Edit, Trash2, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Professor, ProfessorWithFilial } from "@shared/schema";
import ProfessorForm from "@/components/forms/ProfessorForm";

export default function Professores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: professores, isLoading } = useQuery<ProfessorWithFilial[]>({
    queryKey: ["/api/professores"],
  });

  const deleteProfessorMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/professores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professores"] });
      toast({
        title: "Sucesso",
        description: "Professor removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover professor. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredProfessores = professores?.filter((professor) =>
    professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.especialidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.filial?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este professor?")) {
      deleteProfessorMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProfessor(null);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Gestão de Professores</h2>
          <p className="text-neutral-600">Cadastre e gerencie os professores da escola</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <SquareUser className="w-4 h-4 mr-2" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProfessor ? "Editar Professor" : "Cadastrar Novo Professor"}
              </DialogTitle>
            </DialogHeader>
            <ProfessorForm 
              professor={editingProfessor} 
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
                placeholder="Buscar professores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <p className="font-semibold text-lg">{filteredProfessores.length}</p>
                <p className="text-neutral-500">Total</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-green-600">
                  {filteredProfessores.filter(p => p.ativo).length}
                </p>
                <p className="text-neutral-500">Ativos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professores Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Professores</CardTitle>
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
          ) : filteredProfessores.length === 0 ? (
            <div className="text-center py-12">
              <SquareUser className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">
                {searchTerm ? "Nenhum professor encontrado" : "Nenhum professor cadastrado"}
              </h3>
              <p className="text-neutral-500 mb-4">
                {searchTerm 
                  ? "Tente buscar com outros termos." 
                  : "Comece cadastrando o primeiro professor da escola."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <SquareUser className="w-4 h-4 mr-2" />
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
                    <TableHead>Unidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessores.map((professor) => (
                    <TableRow key={professor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{professor.nome}</p>
                          <p className="text-sm text-neutral-500">ID: {professor.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {professor.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1 text-neutral-400" />
                              {professor.email}
                            </div>
                          )}
                          {professor.telefone && (
                            <div className="flex items-center text-sm">
                              <Phone className="w-3 h-3 mr-1 text-neutral-400" />
                              {professor.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {professor.especialidade ? (
                          <Badge variant="outline">{professor.especialidade}</Badge>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {professor.filial ? (
                          <Badge variant="secondary">{professor.filial.nome}</Badge>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={professor.ativo ? "default" : "secondary"}>
                          {professor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(professor)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(professor.id)}
                            disabled={deleteProfessorMutation.isPending}
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
