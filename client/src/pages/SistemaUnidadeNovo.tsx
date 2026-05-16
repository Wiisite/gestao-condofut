import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Users, 
  GraduationCap,
  DollarSign, 
  Calendar,
  FileText,
  Settings,
  BarChart3,
  UserPlus,
  BookOpen,
  CreditCard,
  Activity,
  ArrowLeft,
  LogOut
} from "lucide-react";
import { useUnidadeAuth } from "@/contexts/UnidadeContext";
import AlunosTab from "@/components/unidade/AlunosTab";
import ProfessoresTab from "@/components/unidade/ProfessoresTab";
import TurmasTab from "@/components/unidade/TurmasTab";
import FinanceiroTab from "@/components/unidade/FinanceiroTab";

export default function SistemaUnidadeNovo() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { gestorId, filialId, nomeGestor, nomeFilial, logout } = useUnidadeAuth();
  const [location] = useLocation();

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['dashboard', 'alunos', 'professores', 'turmas', 'financeiro'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const { data: filial, isLoading } = useQuery({
    queryKey: ["/api/filiais", filialId],
    enabled: !!filialId,
  });

  const { data: alunos } = useQuery({
    queryKey: ["/api/alunos"],
    enabled: !!filialId,
  });

  const { data: professores } = useQuery({
    queryKey: ["/api/professores"],
    enabled: !!filialId,
  });

  const { data: turmas } = useQuery({
    queryKey: ["/api/turmas"],
    enabled: !!filialId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const alunosCount = Array.isArray(alunos) ? alunos.filter(a => a.filialId === filialId).length : 0;
  const professoresCount = Array.isArray(professores) ? professores.filter(p => p.filialId === filialId).length : 0;
  const turmasCount = Array.isArray(turmas) ? turmas.filter(t => t.filialId === filialId).length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {nomeFilial || 'Sistema da Unidade'}
              </h1>
              <p className="text-sm text-gray-600">
                Gestor: {nomeGestor || 'Não identificado'}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="alunos" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="professores" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Professores
            </TabsTrigger>
            <TabsTrigger value="turmas" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Turmas
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{alunosCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Alunos matriculados na unidade
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Professores</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{professoresCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Professores ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{turmasCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Turmas em funcionamento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Ativo
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unidade funcionando normalmente
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Unidade</CardTitle>
                  <CardDescription>
                    Dados principais da filial
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Nome:</span>
                    <span className="text-sm">{nomeFilial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">ID:</span>
                    <span className="text-sm">#{filialId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Gestor:</span>
                    <span className="text-sm">{nomeGestor}</span>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    Sistema integrado de gestão escolar
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>
                    Acesse rapidamente as principais funcionalidades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("alunos")}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar Novo Aluno
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("turmas")}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Gerenciar Turmas
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("financeiro")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Controle Financeiro
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alunos">
            <AlunosTab />
          </TabsContent>

          <TabsContent value="professores">
            <ProfessoresTab />
          </TabsContent>

          <TabsContent value="turmas">
            <TurmasTab />
          </TabsContent>

          <TabsContent value="financeiro">
            <FinanceiroTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}