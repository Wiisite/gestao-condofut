import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus, 
  ClipboardList,
  Calendar,
  Clock,
  MapPin,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { 
  TurmaWithProfessor, 
  AlunoWithFilial, 
  Matricula, 
  Presenca,
  InsertMatricula,
  InsertPresenca
} from "@shared/schema";

export default function GestaoTurmas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTurma, setSelectedTurma] = useState<TurmaWithProfessor | null>(null);
  const [isVinculacaoDialogOpen, setIsVinculacaoDialogOpen] = useState(false);
  const [isChamadaDialogOpen, setIsChamadaDialogOpen] = useState(false);
  const [dataChamada, setDataChamada] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: turmas, isLoading: loadingTurmas } = useQuery<TurmaWithProfessor[]>({
    queryKey: ["/api/turmas"],
  });

  const { data: alunos, isLoading: loadingAlunos } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/alunos"],
  });

  const { data: matriculas } = useQuery<Matricula[]>({
    queryKey: ["/api/matriculas"],
  });

  const { data: presencasData } = useQuery<Presenca[]>({
    queryKey: ["/api/presencas", selectedTurma?.id, dataChamada],
    enabled: !!selectedTurma && isChamadaDialogOpen,
  });

  const matricularAlunoMutation = useMutation({
    mutationFn: async (data: InsertMatricula) => {
      await apiRequest("POST", "/api/matriculas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matriculas"] });
      toast({
        title: "Sucesso",
        description: "Aluno vinculado à turma com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao vincular aluno à turma.",
        variant: "destructive",
      });
    },
  });

  const registrarPresencaMutation = useMutation({
    mutationFn: async (data: InsertPresenca[]) => {
      await apiRequest("POST", "/api/presencas/lote", { presencas: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presencas"] });
      toast({
        title: "Sucesso",
        description: "Lista de chamada registrada com sucesso.",
      });
      setIsChamadaDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar lista de chamada.",
        variant: "destructive",
      });
    },
  });

  const filteredTurmas = turmas?.filter((turma) =>
    turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.professor?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getAlunosDaTurma = (turmaId: number) => {
    if (!matriculas || !alunos) return [];
    const matriculasDaTurma = matriculas.filter(m => m.turmaId === turmaId && m.ativo);
    return matriculasDaTurma.map(matricula => 
      alunos.find(aluno => aluno.id === matricula.alunoId)
    ).filter(Boolean) as AlunoWithFilial[];
  };

  const getAlunosDisponiveis = (turmaId: number) => {
    if (!matriculas || !alunos) return [];
    const alunosJaMatriculados = getAlunosDaTurma(turmaId).map(a => a.id);
    return alunos.filter(aluno => 
      aluno.ativo && !alunosJaMatriculados.includes(aluno.id)
    );
  };

  const handleVincularAluno = (alunoId: number) => {
    if (!selectedTurma) return;
    
    matricularAlunoMutation.mutate({
      alunoId,
      turmaId: selectedTurma.id,
      ativo: true,
    });
  };

  const handleChamada = (turma: TurmaWithProfessor) => {
    setSelectedTurma(turma);
    setIsChamadaDialogOpen(true);
  };

  const ListaChamada = () => {
    if (!selectedTurma) return null;
    
    const alunosDaTurma = getAlunosDaTurma(selectedTurma.id);
    const [presencas, setPresencas] = useState<Record<number, { presente: boolean; observacoes: string }>>({});

    const handlePresencaChange = (alunoId: number, presente: boolean) => {
      setPresencas(prev => ({
        ...prev,
        [alunoId]: {
          ...prev[alunoId],
          presente
        }
      }));
    };

    const handleObservacaoChange = (alunoId: number, observacoes: string) => {
      setPresencas(prev => ({
        ...prev,
        [alunoId]: {
          ...prev[alunoId],
          observacoes
        }
      }));
    };

    const handleSalvarChamada = () => {
      const presencasParaSalvar: InsertPresenca[] = alunosDaTurma.map(aluno => ({
        alunoId: aluno.id,
        turmaId: selectedTurma.id,
        data: dataChamada,
        presente: presencas[aluno.id]?.presente || false,
        observacoes: presencas[aluno.id]?.observacoes || null,
        registradoPor: null, // Será preenchido no backend com o professor logado
      }));

      registrarPresencaMutation.mutate(presencasParaSalvar);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Lista de Chamada</h3>
            <p className="text-sm text-neutral-500">
              Turma: {selectedTurma.nome} - {selectedTurma.categoria}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="data-chamada">Data:</Label>
            <Input
              id="data-chamada"
              type="date"
              value={dataChamada}
              onChange={(e) => setDataChamada(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alunosDaTurma.map((aluno) => (
            <div key={aluno.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={presencas[aluno.id]?.presente || false}
                    onCheckedChange={(checked) => 
                      handlePresencaChange(aluno.id, checked as boolean)
                    }
                  />
                  <div>
                    <p className="font-medium">{aluno.nome}</p>
                    <p className="text-sm text-neutral-500">ID: {aluno.id}</p>
                  </div>
                </div>
                <Badge variant={presencas[aluno.id]?.presente ? "default" : "secondary"}>
                  {presencas[aluno.id]?.presente ? "Presente" : "Ausente"}
                </Badge>
              </div>
              <Textarea
                placeholder="Observações (opcional)"
                value={presencas[aluno.id]?.observacoes || ""}
                onChange={(e) => handleObservacaoChange(aluno.id, e.target.value)}
                className="text-sm"
                rows={2}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setIsChamadaDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvarChamada}
            disabled={registrarPresencaMutation.isPending}
          >
            {registrarPresencaMutation.isPending ? "Salvando..." : "Salvar Chamada"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Gestão de Turmas</h2>
          <p className="text-neutral-600">Vincule alunos às turmas e faça a lista de chamada</p>
        </div>
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
          {loadingTurmas ? (
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
          ) : filteredTurmas.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">
                {searchTerm ? "Nenhuma turma encontrada" : "Nenhuma turma cadastrada"}
              </h3>
              <p className="text-neutral-500 mb-4">
                {searchTerm 
                  ? "Tente buscar com outros termos." 
                  : "Cadastre turmas primeiro para gerenciar alunos."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Alunos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurmas.map((turma) => {
                    const alunosDaTurma = getAlunosDaTurma(turma.id);
                    return (
                      <TableRow key={turma.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{turma.nome}</p>
                            <div className="flex items-center space-x-4 text-sm text-neutral-500">
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {turma.categoria}
                              </span>
                              {turma.horario && (
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {turma.horario}
                                </span>
                              )}
                              {turma.diasSemana && (
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {turma.diasSemana}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {turma.professor ? (
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1 text-neutral-400" />
                              {turma.professor.nome}
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {turma.filial ? (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1 text-neutral-400" />
                              <Badge variant="secondary">{turma.filial.nome}</Badge>
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1 text-neutral-400" />
                            <span className="font-medium">{alunosDaTurma.length}</span>
                            <span className="text-neutral-400 ml-1">
                              / {turma.capacidadeMaxima || '∞'}
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
                              onClick={() => {
                                setSelectedTurma(turma);
                                setIsVinculacaoDialogOpen(true);
                              }}
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleChamada(turma)}
                            >
                              <ClipboardList className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Vinculação de Alunos */}
      <Dialog open={isVinculacaoDialogOpen} onOpenChange={setIsVinculacaoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Vincular Alunos à Turma: {selectedTurma?.nome}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTurma && (
            <div className="grid grid-cols-2 gap-6">
              {/* Alunos Vinculados */}
              <div>
                <h3 className="text-lg font-medium mb-3">Alunos Vinculados</h3>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  {getAlunosDaTurma(selectedTurma.id).map((aluno) => (
                    <div key={aluno.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{aluno.nome}</p>
                        <p className="text-sm text-neutral-500">ID: {aluno.id}</p>
                      </div>
                      <Badge variant="default">Vinculado</Badge>
                    </div>
                  ))}
                  {getAlunosDaTurma(selectedTurma.id).length === 0 && (
                    <p className="text-neutral-500 text-center py-4">
                      Nenhum aluno vinculado
                    </p>
                  )}
                </div>
              </div>

              {/* Alunos Disponíveis */}
              <div>
                <h3 className="text-lg font-medium mb-3">Alunos Disponíveis</h3>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  {getAlunosDisponiveis(selectedTurma.id).map((aluno) => (
                    <div key={aluno.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{aluno.nome}</p>
                        <p className="text-sm text-neutral-500">
                          ID: {aluno.id} - {aluno.filial?.nome}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleVincularAluno(aluno.id)}
                        disabled={matricularAlunoMutation.isPending}
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Vincular
                      </Button>
                    </div>
                  ))}
                  {getAlunosDisponiveis(selectedTurma.id).length === 0 && (
                    <p className="text-neutral-500 text-center py-4">
                      Nenhum aluno disponível
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Lista de Chamada */}
      <Dialog open={isChamadaDialogOpen} onOpenChange={setIsChamadaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lista de Chamada</DialogTitle>
          </DialogHeader>
          <ListaChamada />
        </DialogContent>
      </Dialog>
    </div>
  );
}