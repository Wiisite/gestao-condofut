import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Search, Edit, Trash2, Phone, MapPin, User, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Filial } from "@shared/schema";
import FilialForm from "@/components/forms/FilialForm";

export default function Filiais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: filiais, isLoading } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const deleteFilialMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/filiais/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      toast({
        title: "Sucesso",
        description: "Unidade removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover filial. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredFiliais = filiais?.filter((filial) =>
    filial.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filial.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filial.responsavel?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (filial: Filial) => {
    setEditingFilial(filial);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta filial?")) {
      deleteFilialMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingFilial(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Gestão de Unidades</h2>
          <p className="text-neutral-600">Gerencie as unidades da escola de futebol</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFilial ? "Editar Unidade" : "Cadastrar Nova Unidade"}
              </DialogTitle>
            </DialogHeader>
            <FilialForm 
              filial={editingFilial} 
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
                placeholder="Buscar unidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <p className="font-semibold text-lg">{filteredFiliais.length}</p>
                <p className="text-neutral-500">Total</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-green-600">
                  {filteredFiliais.filter(f => f.ativa).length}
                </p>
                <p className="text-neutral-500">Ativas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filiais Table */}
      <Card>
        <CardHeader>
          <CardTitle>Filiais Cadastradas</CardTitle>
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
          ) : filteredFiliais.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">
                {searchTerm ? "Nenhuma filial encontrada" : "Nenhuma filial cadastrada"}
              </h3>
              <p className="text-neutral-500 mb-4">
                {searchTerm
                  ? "Tente ajustar os termos de busca." 
                  : "Comece cadastrando a primeira filial da escola."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeira Filial
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Filial</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiliais.map((filial) => (
                    <TableRow key={filial.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{filial.nome}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
                          <span className="text-sm max-w-xs truncate">{filial.endereco}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-neutral-400" />
                          <span className="text-sm">{filial.responsavel || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-neutral-400" />
                          <span className="text-sm">{filial.telefone || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={filial.ativa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {filial.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(filial)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(filial.id)}
                            disabled={deleteFilialMutation.isPending}
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