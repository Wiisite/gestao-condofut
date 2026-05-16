import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  Calendar,
  LogOut,
  Settings,
  FileText,
  UserCheck,
  TrendingUp,
  Building2,
  Menu,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UnidadeSession {
  gestorId: number;
  filialId: number;
  nomeGestor: string;
  nomeFilial: string;
  loginTime: string;
}

export default function DashboardPortalUnidade() {
  const [match, params] = useRoute("/unidade/:filialId/dashboard");
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<UnidadeSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // First check localStorage for session data
        const sessionData = localStorage.getItem('unidadeSession');
        if (!sessionData) {
          setLocation("/portal-unidade");
          return;
        }

        const parsedSession = JSON.parse(sessionData);
        
        // Verify session with server
        const response = await apiRequest("GET", "/api/unidade/auth/check");
        const authData = await response.json();
        
        if (authData.authenticated) {
          setSession(parsedSession);
          
          // Verify filialId matches URL parameter
          if (params?.filialId && parseInt(params.filialId) !== parsedSession.filialId) {
            toast({
              title: "Acesso negado",
              description: "Você não tem permissão para acessar esta unidade",
              variant: "destructive",
            });
            setLocation("/portal-unidade");
            return;
          }
        } else {
          // Server session expired, clear localStorage and redirect
          localStorage.removeItem('unidadeSession');
          setLocation("/portal-unidade");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.removeItem('unidadeSession');
        setLocation("/portal-unidade");
      }
    };

    checkAuthentication();
  }, [params, setLocation, toast]);

  const { data: metrics, isLoading } = useQuery<{
    totalAlunos: number;
    totalProfessores: number;
    totalTurmas: number;
    receitaMensal: number;
  }>({
    queryKey: ["/api/unidade/dashboard/metrics", session?.filialId],
    enabled: !!session?.filialId,
  });

  const { data: unidadeInfo } = useQuery({
    queryKey: ["/api/filiais", session?.filialId],
    enabled: !!session?.filialId,
  });

  const handleLogout = () => {
    localStorage.removeItem('unidadeSession');
    toast({
      title: "Logout realizado",
      description: "Sessão encerrada com sucesso",
    });
    setLocation("/portal-unidade");
  };

  const menuItems = [
    { 
      label: "Dashboard", 
      icon: TrendingUp, 
      path: `/unidade/${session?.filialId}/dashboard`,
      active: true
    },
    { 
      label: "Alunos", 
      icon: Users, 
      path: `/unidade/${session?.filialId}/alunos`
    },
    { 
      label: "Professores", 
      icon: GraduationCap, 
      path: `/unidade/${session?.filialId}/professores`
    },
    { 
      label: "Turmas", 
      icon: Calendar, 
      path: `/unidade/${session?.filialId}/turmas`
    },
    { 
      label: "Financeiro", 
      icon: DollarSign, 
      path: `/unidade/${session?.filialId}/financeiro`
    },
    { 
      label: "Presenças", 
      icon: UserCheck, 
      path: `/unidade/${session?.filialId}/presencas`
    },
    { 
      label: "Relatórios", 
      icon: FileText, 
      path: `/unidade/${session?.filialId}/relatorios`
    }
  ];

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{session.nomeFilial}</h1>
                <p className="text-sm text-gray-600">Portal da Unidade</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{session.nomeGestor}</p>
              <p className="text-xs text-gray-600">Gestor da Unidade</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:shadow-none lg:border-r border-gray-200`}>
          <div className="p-4 border-b border-gray-200 lg:hidden">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant={item.active ? "default" : "ghost"}
                className={`w-full justify-start ${
                  item.active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setLocation(item.path);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard da Unidade</h2>
            <p className="text-gray-600">Visão geral das atividades da {session.nomeFilial}</p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Alunos
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded" />
                  ) : (
                    metrics?.totalAlunos || 0
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  +2 novos esta semana
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Professores
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded" />
                  ) : (
                    metrics?.totalProfessores || 0
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Ativos na unidade
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Turmas Ativas
                </CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded" />
                  ) : (
                    metrics?.totalTurmas || 0
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Em funcionamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Receita Mensal
                </CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded" />
                  ) : (
                    `R$ ${(metrics?.receitaMensal || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}`
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Mês atual
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation(`/unidade/${session.filialId}/alunos/novo`)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Cadastrar Novo Aluno
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation(`/unidade/${session.filialId}/presencas`)}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Registrar Presenças
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation(`/unidade/${session.filialId}/financeiro`)}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Gerenciar Pagamentos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Status da Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Última sincronização:</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Há 2 minutos
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className="bg-green-100 text-green-800">
                      Sincronizado
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Todos os dados são automaticamente enviados para a matriz em tempo real.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}