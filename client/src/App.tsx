import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { UnidadeProvider } from "@/contexts/UnidadeContext";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/AdminLogin";
import Dashboard from "@/pages/Dashboard";
import Alunos from "@/pages/AlunosFixed";
import Professores from "@/pages/Professores";
import Turmas from "@/pages/Turmas";
import GestaoTurmas from "@/pages/GestaoTurmas";
import Financeiro from "@/pages/Financeiro";
import Relatorios from "@/pages/Relatorios";
import RelatorioPresencas from "@/pages/RelatorioPresencas";
import GestaoUnidades from "@/pages/GestaoUnidades";
import DashboardUnidadeWrapper from "@/pages/DashboardUnidadeWrapper";
import PainelUnidade from "@/pages/PainelUnidade";
import LoginUnidade from "@/pages/LoginUnidade";
import CadastroGestorUnidade from "@/pages/CadastroGestorUnidade";
import AlunosUnidade from "@/pages/AlunosUnidade";
import ProfessoresUnidade from "@/pages/ProfessoresUnidade";
import TurmasUnidade from "@/pages/TurmasUnidade";
import FinanceiroUnidade from "@/pages/FinanceiroUnidade";
import UnidadeAlunos from "@/pages/UnidadeAlunos";
import UnidadeProfessores from "@/pages/UnidadeProfessores";
import FinanceiroCompleto from "@/pages/FinanceiroCompleto";
import Filiais from "@/pages/Filiais";
import DashboardUnidades from "@/pages/DashboardUnidades";
import ResponsavelEntrada from "@/pages/ResponsavelEntrada";
import ResponsavelLogin from "@/pages/ResponsavelLogin";
import ResponsavelCadastro from "@/pages/ResponsavelCadastro";
import ResponsavelPortal from "@/pages/ResponsavelPortalSimples";
import AvaliacaoFisica from "@/pages/AvaliacaoFisica";
import PortalUnidades from "@/pages/PortalUnidades";
import CombosAulas from "@/pages/CombosAulas";
import CadastroAluno from "@/pages/CadastroAluno";
import PortalUnidadeNovo from "@/pages/PortalUnidadeNovo";
import ConfiguracoesSimples from "@/pages/ConfiguracoesSimples";
import GerenciarAdmins from "@/pages/GerenciarAdmins";
import AdminCadastro from "@/pages/AdminCadastro";
import UnidadesConsolidado from "@/pages/UnidadesConsolidado";
import SistemaUnidadeNovo from "@/pages/SistemaUnidadeNovo";
import UnidadeProtectedRoute from "@/components/UnidadeProtectedRoute";
import UnidadeRedirect from "@/components/UnidadeRedirect";
import DashboardPortalUnidade from "@/pages/DashboardPortalUnidade";
import CadastroGestorUnidadePortal from "@/pages/CadastroGestorUnidadePortal";
import CadastroAlunoUnidade from "@/pages/CadastroAlunoUnidade";
import Landing from "@/pages/Landing";
import CheckoutDemo from "@/pages/CheckoutDemo";
import CheckoutSimulado from "@/pages/CheckoutSimulado";
import PortalEscola from "@/pages/PortalEscola";
import PortalUnidadesPublico from "@/pages/PortalUnidadesPublico";
import PortalUnidadePublicoDetalhes from "@/pages/PortalUnidadePublicoDetalhes";
import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/landingpage" component={Landing} />
      <Route path="/checkout-demo" component={CheckoutDemo} />
      <Route path="/pagamento/simulado/:id" component={CheckoutSimulado} />
      {/* Portal do Responsável - Rotas independentes */}
      <Route path="/responsavel" component={ResponsavelLogin} />
      <Route path="/responsavel/cadastro" component={ResponsavelCadastro} />
      <Route path="/responsavel/login" component={ResponsavelLogin} />
      <Route path="/portal" component={ResponsavelPortal} />

      
      {/* Portal da Unidade - Novo Sistema Unificado */}
      <Route path="/portal-unidade" component={PortalUnidadesPublico} />
      <Route path="/portal-unidade/:id" component={PortalUnidadePublicoDetalhes} />
      <Route path="/portal-unidade/login" component={PortalUnidadeNovo} />
      <Route path="/unidade/sistema">
        <UnidadeProtectedRoute>
          <SistemaUnidadeNovo />
        </UnidadeProtectedRoute>
      </Route>
      <Route path="/unidade/cadastro-aluno">
        <UnidadeProtectedRoute>
          <CadastroAlunoUnidade />
        </UnidadeProtectedRoute>
      </Route>
      
      {/* Redirect para compatibilidade */}
      <Route path="/unidade/:filialId/sistema" component={UnidadeRedirect} />
      <Route path="/cadastro-gestor-unidade" component={CadastroGestorUnidadePortal} />
      <Route path="/unidade/:filialId/dashboard" component={DashboardPortalUnidade} />
      <Route path="/unidade/:filialId/alunos" component={AlunosUnidade} />
      <Route path="/unidade/:filialId/professores" component={ProfessoresUnidade} />
      <Route path="/unidade/:filialId/turmas" component={TurmasUnidade} />
      <Route path="/unidade/:filialId/financeiro" component={FinanceiroUnidade} />
      <Route path="/unidade/:filialId/presencas" component={RelatorioPresencas} />
      <Route path="/unidade/:filialId/relatorios" component={Relatorios} />
      <Route path="/unidade/login" component={LoginUnidade} />
      <Route path="/unidade/cadastro" component={CadastroGestorUnidade} />
      <Route path="/login-unidade" component={LoginUnidade} />
      <Route path="/unidade/alunos" component={UnidadeAlunos} />
      <Route path="/unidade/professores" component={UnidadeProfessores} />
      <Route path="/unidade/turmas" component={TurmasUnidade} />
      <Route path="/unidade/financeiro" component={FinanceiroUnidade} />
      <Route path="/unidade/matriculas" component={GestaoTurmas} />
      <Route path="/unidade/relatorios" component={Relatorios} />
      <Route path="/unidade/presencas" component={RelatorioPresencas} />
      <Route path="/unidade/dashboard" component={DashboardUnidadeWrapper} />
      
      {/* Sistema Administrativo Principal */}
      {!isAuthenticated ? (
        <>
          <Route path="/" component={PortalEscola} />
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/admin/cadastro" component={AdminCadastro} />
        </>
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/alunos" component={Alunos} />
          <Route path="/professores" component={Professores} />
          <Route path="/turmas" component={Turmas} />
          <Route path="/gestao-turmas" component={GestaoTurmas} />
          <Route path="/unidades" component={UnidadesConsolidado} />
          <Route path="/filiais" component={UnidadesConsolidado} />
          <Route path="/dashboard-unidades" component={DashboardUnidades} />
          <Route path="/financeiro" component={FinanceiroCompleto} />
          <Route path="/relatorios" component={Relatorios} />
          <Route path="/relatorio-presencas" component={RelatorioPresencas} />
          <Route path="/avaliacao-fisica" component={AvaliacaoFisica} />
          <Route path="/portal-unidades" component={PortalUnidades} />
          <Route path="/gestao-unidades" component={GestaoUnidades} />
          <Route path="/combos-aulas" component={CombosAulas} />
          <Route path="/cadastro-aluno" component={CadastroAluno} />
          <Route path="/configuracoes" component={ConfiguracoesSimples} />
          <Route path="/gerenciar-admins" component={GerenciarAdmins} />
          <Route path="/unidade/:filialId" component={DashboardUnidadeWrapper} />
        </Layout>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UnidadeProvider>
          <Toaster />
          <Router />
        </UnidadeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
