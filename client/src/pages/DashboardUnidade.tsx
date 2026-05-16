import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, GraduationCap, DollarSign, Calendar, FileText, Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Filial, AlunoWithFilial, Professor, TurmaWithProfessor } from "@shared/schema";

interface DashboardUnidadeProps {
  filialId: number;
}

export default function DashboardUnidade({ filialId }: DashboardUnidadeProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: filial, isLoading: loadingFilial } = useQuery<Filial>({
    queryKey: [`/api/filiais/${filialId}`],
  });

  const { data: alunos, isLoading: loadingAlunos } = useQuery<AlunoWithFilial[]>({
    queryKey: [`/api/alunos?filialId=${filialId}`],
  });

  const { data: professores, isLoading: loadingProfessores } = useQuery<Professor[]>({
    queryKey: [`/api/professores?filialId=${filialId}`],
  });

  const { data: turmas, isLoading: loadingTurmas } = useQuery<TurmaWithProfessor[]>({
    queryKey: [`/api/turmas?filialId=${filialId}`],
  });

  const { data: pagamentos = [] } = useQuery<any[]>({
    queryKey: ["/api/pagamentos"],
  });

  if (loadingFilial) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!filial) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Unidade não encontrada</h2>
        <Button onClick={() => setLocation("/gestao-unidades")}>
          Voltar para Gestão de Unidades
        </Button>
      </div>
    );
  }

  const totalAlunos = alunos?.length || 0;
  const totalProfessores = professores?.length || 0;
  const totalTurmas = turmas?.length || 0;

  // Calcular receita mensal baseada nos pagamentos reais
  const mesAtual = new Date().toISOString().slice(0, 7);
  const alunoIds = alunos?.map(a => a.id) || [];
  const pagamentosUnidade = pagamentos.filter(
    (p: any) => alunoIds.includes(p.alunoId) && 
    p.status === 'pago' && 
    p.mesReferencia === mesAtual
  );
  const receitaMensal = pagamentosUnidade.reduce(
    (acc: number, p: any) => acc + parseFloat(p.valor || "0"), 0
  );

  const metrics = [
    {
      title: "Total de Alunos",
      value: totalAlunos.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Professores",
      value: totalProfessores.toString(),
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Turmas Ativas",
      value: totalTurmas.toString(),
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Receita Mensal",
      value: `R$ ${receitaMensal.toLocaleString("pt-BR")}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{filial.nome}</h1>
          <p className="text-gray-600 mt-1">{filial.endereco}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={filial.ativa ? "default" : "secondary"}>
              {filial.ativa ? "Ativa" : "Inativa"}
            </Badge>
            <span className="text-sm text-gray-500">
              Telefone: {filial.telefone}
            </span>
          </div>
        </div>
        <Button onClick={() => setLocation("/gestao-unidades")} variant="outline">
          Voltar para Gestão
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs de Gestão */}
      <Tabs defaultValue="alunos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="professores">Professores</TabsTrigger>
          <TabsTrigger value="turmas">Turmas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Tab Alunos */}
        <TabsContent value="alunos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gestão de Alunos</h2>
            <Button onClick={() => setLocation("/alunos")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Aluno
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alunos Matriculados</CardTitle>
              <CardDescription>
                Lista de todos os alunos matriculados nesta unidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAlunos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : alunos && alunos.length > 0 ? (
                <div className="space-y-4">
                  {alunos.map((aluno) => (
                    <div
                      key={aluno.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{aluno.nome}</h3>
                        <p className="text-sm text-gray-600">{aluno.email}</p>
                        {aluno.cpf && (
                          <p className="text-sm text-gray-500">CPF: {aluno.cpf}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={aluno.statusPagamento?.emDia ? "default" : "destructive"}>
                          {aluno.statusPagamento?.emDia ? "Em dia" : "Pendente"}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum aluno matriculado nesta unidade</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Professores */}
        <TabsContent value="professores" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gestão de Professores</h2>
            <Button onClick={() => setLocation("/professores")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Professor
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Professores Ativos</CardTitle>
              <CardDescription>
                Lista de todos os professores desta unidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProfessores ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : professores && professores.length > 0 ? (
                <div className="space-y-4">
                  {professores.map((professor) => (
                    <div
                      key={professor.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{professor.nome}</h3>
                        <p className="text-sm text-gray-600">{professor.email}</p>
                        <p className="text-sm text-gray-500">
                          Especialidade: {professor.especialidade}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={professor.ativo ? "default" : "secondary"}>
                          {professor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum professor cadastrado nesta unidade</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Turmas */}
        <TabsContent value="turmas" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gestão de Turmas</h2>
            <Button onClick={() => setLocation("/turmas")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Turma
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Turmas Ativas</CardTitle>
              <CardDescription>
                Lista de todas as turmas desta unidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTurmas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : turmas && turmas.length > 0 ? (
                <div className="space-y-4">
                  {turmas.map((turma) => (
                    <div
                      key={turma.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{turma.nome}</h3>
                        <p className="text-sm text-gray-600">
                          Categoria: {turma.categoria}
                        </p>
                        <p className="text-sm text-gray-500">
                          Professor: {turma.professor?.nome || "Não definido"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Horário: {turma.horario}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          {turma._count?.matriculas || 0} alunos
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma turma criada nesta unidade</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Relatórios */}
        <TabsContent value="relatorios" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Relatórios da Unidade</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setLocation("/relatorio-presencas")}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="font-medium">Relatório de Presenças</h3>
                    <p className="text-sm text-gray-600">
                      Controle de frequência dos alunos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation("/financeiro")}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <h3 className="font-medium">Relatório Financeiro</h3>
                    <p className="text-sm text-gray-600">
                      Controle de pagamentos e receitas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation("/relatorios")}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <h3 className="font-medium">Relatórios Gerais</h3>
                    <p className="text-sm text-gray-600">
                      Todos os relatórios da unidade
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}