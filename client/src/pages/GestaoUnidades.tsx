import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  Users,
  UserCheck,
  DollarSign,
  Calendar,
  Settings,
  Shield,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { 
  Filial, 
  InsertFilial,
  AlunoWithFilial,
  Professor,
  TurmaWithProfessor
} from "@shared/schema";

interface FilialDetalhada extends Filial {
  totalAlunos: number;
  totalProfessores: number;
  totalTurmas: number;
  receitaMensal: number;
}

export default function GestaoUnidades() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const [selectedFilial, setSelectedFilial] = useState<FilialDetalhada | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: filiais, isLoading: loadingFiliais } = useQuery<FilialDetalhada[]>({
    queryKey: ["/api/filiais/detalhadas"],
  });

  const { data: alunosPorFilial } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/alunos", { filialId: selectedFilial?.id }],
    enabled: !!selectedFilial,
  });

  const { data: professoresPorFilial } = useQuery<Professor[]>({
    queryKey: ["/api/professores", { filialId: selectedFilial?.id }],
    enabled: !!selectedFilial,
  });

  const { data: turmasPorFilial } = useQuery<TurmaWithProfessor[]>({
    queryKey: ["/api/turmas", { filialId: selectedFilial?.id }],
    enabled: !!selectedFilial,
  });

  const createFilialMutation = useMutation({
    mutationFn: async (data: InsertFilial) => {
      return await apiRequest("POST", "/api/filiais", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais/detalhadas"] });
      setIsDialogOpen(false);
      toast({
        title: "Unidade criada",
        description: "Nova unidade criada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar unidade",
        variant: "destructive",
      });
    },
  });

  const updateFilialMutation = useMutation({
    mutationFn: async (data: { id: number; filial: Partial<InsertFilial> }) => {
      return await apiRequest("PATCH", `/api/filiais/${data.id}`, data.filial);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais/detalhadas"] });
      setIsDialogOpen(false);
      setSelectedFilial(null);
      toast({
        title: "Unidade atualizada",
        description: "Dados da unidade atualizados com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar unidade",
        variant: "destructive",
      });
    },
  });

  const deleteFilialMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/filiais/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais/detalhadas"] });
      toast({
        title: "Unidade excluída",
        description: "Unidade excluída com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir unidade",
        variant: "destructive",
      });
    },
  });

  const filteredFiliais = filiais?.filter(filial =>
    filial.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filial.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      endereco: formData.get("endereco") as string,
      telefone: formData.get("telefone") as string,
      responsavel: formData.get("responsavel") as string,
      ativa: true,
    };

    if (selectedFilial) {
      updateFilialMutation.mutate({ id: selectedFilial.id, filial: data });
    } else {
      createFilialMutation.mutate(data);
    }
  };

  const handleEdit = (filial: FilialDetalhada) => {
    setSelectedFilial(filial);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (filial: FilialDetalhada) => {
    setSelectedFilial(filial);
    setIsViewingDetails(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta unidade?")) {
      deleteFilialMutation.mutate(id);
    }
  };

  const renderFilialForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nome" className="block text-sm font-medium mb-1">
          Nome da Unidade
        </label>
        <Input
          id="nome"
          name="nome"
          defaultValue={selectedFilial?.nome}
          required
        />
      </div>
      <div>
        <label htmlFor="endereco" className="block text-sm font-medium mb-1">
          Endereço
        </label>
        <Input
          id="endereco"
          name="endereco"
          defaultValue={selectedFilial?.endereco}
          required
        />
      </div>
      <div>
        <label htmlFor="telefone" className="block text-sm font-medium mb-1">
          Telefone
        </label>
        <Input
          id="telefone"
          name="telefone"
          defaultValue={selectedFilial?.telefone || ""}
        />
      </div>
      <div>
        <label htmlFor="responsavel" className="block text-sm font-medium mb-1">
          Responsável
        </label>
        <Input
          id="responsavel"
          name="responsavel"
          defaultValue={selectedFilial?.responsavel || ""}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => {
          setIsDialogOpen(false);
          setSelectedFilial(null);
        }}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createFilialMutation.isPending || updateFilialMutation.isPending}>
          {selectedFilial ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Gestão de Unidades</h2>
          <p className="text-neutral-600">Administre as unidades da rede</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedFilial(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedFilial ? "Editar Unidade" : "Nova Unidade"}
              </DialogTitle>
            </DialogHeader>
            {renderFilialForm()}
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

      {/* Unidades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingFiliais ? (
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          filteredFiliais.map((filial) => (
            <Card key={filial.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{filial.nome}</CardTitle>
                  </div>
                  <Badge variant={filial.ativa ? "default" : "secondary"}>
                    {filial.ativa ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-neutral-600">
                  <p>{filial.endereco}</p>
                  {filial.telefone && <p>{filial.telefone}</p>}
                  {filial.responsavel && <p>Responsável: {filial.responsavel}</p>}
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-neutral-500">Alunos</p>
                    <p className="font-semibold text-blue-600">{filial.totalAlunos}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-neutral-500">Professores</p>
                    <p className="font-semibold text-green-600">{filial.totalProfessores}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-neutral-500">Turmas</p>
                    <p className="font-semibold text-purple-600">{filial.totalTurmas}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-neutral-500">Receita</p>
                    <p className="font-semibold text-orange-600">
                      R$ {filial.receitaMensal?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setLocation(`/unidade/${filial.id}`)}
                    >
                      <Building2 className="w-4 h-4 mr-1" />
                      Painel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(filial)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                  <div className="flex space-x-2">
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
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Detalhes da Unidade */}
      <Dialog open={isViewingDetails} onOpenChange={setIsViewingDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Unidade: {selectedFilial?.nome}
            </DialogTitle>
          </DialogHeader>
          
          {selectedFilial && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="students">Alunos</TabsTrigger>
                <TabsTrigger value="teachers">Professores</TabsTrigger>
                <TabsTrigger value="classes">Turmas</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold">{selectedFilial.totalAlunos}</p>
                      <p className="text-sm text-neutral-500">Alunos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">{selectedFilial.totalProfessores}</p>
                      <p className="text-sm text-neutral-500">Professores</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold">{selectedFilial.totalTurmas}</p>
                      <p className="text-sm text-neutral-500">Turmas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                      <p className="text-2xl font-bold">R$ {selectedFilial.receitaMensal?.toFixed(2)}</p>
                      <p className="text-sm text-neutral-500">Receita Mensal</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="students">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Alunos da Unidade</h3>
                  {alunosPorFilial && alunosPorFilial.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alunosPorFilial.map((aluno) => (
                          <TableRow key={aluno.id}>
                            <TableCell>{aluno.nome}</TableCell>
                            <TableCell>{aluno.email || "-"}</TableCell>
                            <TableCell>{aluno.telefone || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={aluno.ativo ? "default" : "secondary"}>
                                {aluno.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-neutral-500">Nenhum aluno cadastrado nesta unidade</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="teachers">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Professores da Unidade</h3>
                  {professoresPorFilial && professoresPorFilial.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Especialidade</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {professoresPorFilial.map((professor) => (
                          <TableRow key={professor.id}>
                            <TableCell>{professor.nome}</TableCell>
                            <TableCell>{professor.email || "-"}</TableCell>
                            <TableCell>{professor.especialidade || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={professor.ativo ? "default" : "secondary"}>
                                {professor.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-neutral-500">Nenhum professor cadastrado nesta unidade</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="classes">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Turmas da Unidade</h3>
                  {turmasPorFilial && turmasPorFilial.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Professor</TableHead>
                          <TableHead>Horário</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {turmasPorFilial.map((turma) => (
                          <TableRow key={turma.id}>
                            <TableCell>{turma.nome}</TableCell>
                            <TableCell>{turma.categoria}</TableCell>
                            <TableCell>{turma.professor?.nome || "-"}</TableCell>
                            <TableCell>{turma.horario || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={turma.ativo ? "default" : "secondary"}>
                                {turma.ativo ? "Ativa" : "Inativa"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-neutral-500">Nenhuma turma cadastrada nesta unidade</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}