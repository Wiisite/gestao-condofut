import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  DollarSign, 
  Calendar, 
  FileText, 
  Plus, 
  Edit, 
  Search,
  Building2,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import { InterLogo } from "@/components/InterLogo";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Filial, AlunoWithFilial, Professor, TurmaWithProfessor } from "@shared/schema";

export default function PainelUnidade() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Recuperar unidade selecionada do localStorage
  const unidadeSelecionada = localStorage.getItem("unidade_selecionada");
  const filialId = unidadeSelecionada ? parseInt(unidadeSelecionada) : null;

  // Se não há unidade selecionada, redirecionar para seleção
  if (!filialId) {
    setLocation("/login-unidade");
    return null;
  }

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

  if (loadingFilial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!filial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unidade não encontrada</h2>
          <Button onClick={() => setLocation("/")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalAlunos = alunos?.length || 0;
  const totalProfessores = professores?.length || 0;
  const totalTurmas = turmas?.length || 0;
  const receitaMensal = totalAlunos * 150; // Simulação baseada em mensalidade média

  const filteredAlunos = alunos?.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const metrics = [
    {
      title: "Total de Alunos",
      value: totalAlunos.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Professores Ativos",
      value: totalProfessores.toString(),
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+2",
      changeType: "positive" as const,
    },
    {
      title: "Turmas em Andamento",
      value: totalTurmas.toString(),
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "0",
      changeType: "neutral" as const,
    },
    {
      title: "Receita Mensal",
      value: `R$ ${receitaMensal.toLocaleString("pt-BR")}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "+8%",
      changeType: "positive" as const,
    },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Unidade */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center p-1 mr-3">
                <InterLogo size={32} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{filial.nome}</h1>
                <p className="text-sm text-gray-600">Painel Administrativo</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={filial.ativa ? "default" : "secondary"}>
                {filial.ativa ? "Ativa" : "Inativa"}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações da Unidade */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center p-0.5">
                  <InterLogo size={14} />
                </div>
                Informações da Unidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">{filial.endereco}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{filial.telefone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Responsável</p>
                  <p className="font-medium">{filial.responsavel || "Não informado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                      {metric.changeType !== "neutral" && (
                        <span className={`ml-2 text-sm ${
                          metric.changeType === "positive" ? "text-green-600" : "text-red-600"
                        }`}>
                          {metric.change}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navegação por Abas */}
        <Tabs defaultValue="alunos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alunos" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="professores" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Professores
            </TabsTrigger>
            <TabsTrigger value="turmas" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Turmas
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Tab Alunos */}
          <TabsContent value="alunos" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Gestão de Alunos</h2>
              <Button onClick={() => setLocation("/alunos")}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Aluno
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Alunos Matriculados ({totalAlunos})</CardTitle>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar alunos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAlunos ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredAlunos.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAlunos.map((aluno) => (
                      <div
                        key={aluno.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{aluno.nome}</h3>
                          <p className="text-sm text-gray-600">{aluno.email}</p>
                          {aluno.cpf && (
                            <p className="text-sm text-gray-500">CPF: {aluno.cpf}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={aluno.statusPagamento?.emDia ? "default" : "destructive"}>
                            {aluno.statusPagamento?.emDia ? "Em dia" : "Pendente"}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno matriculado"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Professores */}
          <TabsContent value="professores" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Gestão de Professores</h2>
              <Button onClick={() => setLocation("/professores")}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Professor
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Professores Ativos ({totalProfessores})</CardTitle>
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
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{professor.nome}</h3>
                          <p className="text-sm text-gray-600">{professor.email}</p>
                          <p className="text-sm text-gray-500">
                            Especialidade: {professor.especialidade}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={professor.ativo ? "default" : "secondary"}>
                            {professor.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum professor cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Turmas */}
          <TabsContent value="turmas" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Gestão de Turmas</h2>
              <Button onClick={() => setLocation("/turmas")}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Turmas Ativas ({totalTurmas})</CardTitle>
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
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{turma.nome}</h3>
                          <p className="text-sm text-gray-600">Categoria: {turma.categoria}</p>
                          <p className="text-sm text-gray-500">
                            Professor: {turma.professor?.nome || "Não definido"}
                          </p>
                          <p className="text-sm text-gray-500">Horário: {turma.horario}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="default">
                            {turma._count?.matriculas || 0} alunos
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma turma criada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Relatórios */}
          <TabsContent value="relatorios" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Relatórios da Unidade</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    onClick={() => setLocation("/gestao-turmas")}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <h3 className="font-medium">Gestão de Turmas</h3>
                      <p className="text-sm text-gray-600">
                        Lista de presença e controle
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setLocation("/relatorios")}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-orange-600" />
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
    </div>
  );
}