import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowLeft,
  BarChart3,
  Target,
  Calendar
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Filial, AlunoWithFilial } from "@shared/schema";

interface UnidadeMetrics {
  unidadeId: number;
  nomeUnidade: string;
  totalAlunos: number;
  alunosAtivos: number;
  alunosEmDia: number;
  alunosAtrasados: number;
  receitaMensal: number;
  percentualPagantes: number;
}

export default function DashboardUnidades() {
  const { data: unidades, isLoading: loadingUnidades } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const { data: alunos, isLoading: loadingAlunos } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/alunos"],
  });

  const { data: pagamentos = [] } = useQuery<any[]>({
    queryKey: ["/api/pagamentos"],
  });

  const calcularMetricasUnidades = (): UnidadeMetrics[] => {
    if (!unidades || !alunos) return [];

    // Mês atual para filtrar pagamentos
    const mesAtual = new Date().toISOString().slice(0, 7);

    return unidades.map(unidade => {
      const alunosUnidade = alunos.filter(aluno => aluno.filialId === unidade.id);
      const alunosAtivos = alunosUnidade.filter(aluno => aluno.ativo);
      const alunosEmDia = alunosUnidade.filter(aluno => aluno.statusPagamento?.emDia);
      const alunosAtrasados = alunosUnidade.filter(aluno => aluno.statusPagamento && !aluno.statusPagamento.emDia);
      
      // Calcular receita real baseada nos pagamentos do mês atual
      const alunoIdsUnidade = alunosUnidade.map(a => a.id);
      const pagamentosUnidade = pagamentos.filter(
        (p: any) => alunoIdsUnidade.includes(p.alunoId) && 
        p.status === 'pago' && 
        p.mesReferencia === mesAtual
      );
      const receitaReal = pagamentosUnidade.reduce(
        (acc: number, p: any) => acc + parseFloat(p.valor || "0"), 0
      );
      
      return {
        unidadeId: unidade.id,
        nomeUnidade: unidade.nome,
        totalAlunos: alunosUnidade.length,
        alunosAtivos: alunosAtivos.length,
        alunosEmDia: alunosEmDia.length,
        alunosAtrasados: alunosAtrasados.length,
        receitaMensal: receitaReal,
        percentualPagantes: alunosUnidade.length > 0 ? (alunosEmDia.length / alunosUnidade.length) * 100 : 0
      };
    });
  };

  const metricas = calcularMetricasUnidades();
  const isLoading = loadingUnidades || loadingAlunos;

  const dadosGraficoBarras = metricas.map(m => ({
    nome: m.nomeUnidade,
    alunos: m.totalAlunos,
    ativos: m.alunosAtivos,
    emDia: m.alunosEmDia,
    atrasados: m.alunosAtrasados
  }));

  const dadosGraficoPizza = metricas.map(m => ({
    name: m.nomeUnidade,
    value: m.totalAlunos,
    receita: m.receitaMensal
  }));

  const cores = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  const totalGeral = {
    alunos: metricas.reduce((acc, m) => acc + m.totalAlunos, 0),
    ativos: metricas.reduce((acc, m) => acc + m.alunosAtivos, 0),
    emDia: metricas.reduce((acc, m) => acc + m.alunosEmDia, 0),
    receita: metricas.reduce((acc, m) => acc + m.receitaMensal, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard Principal
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-neutral-800">Dashboard das Unidades</h2>
            <p className="text-neutral-600">Visão comparativa de todas as unidades</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => window.location.href = '/filiais'}>
            <Building2 className="w-4 h-4 mr-2" />
            Gerenciar Unidades
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Total de Alunos</p>
                <p className="text-2xl font-bold">{totalGeral.alunos}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Alunos Ativos</p>
                <p className="text-2xl font-bold text-green-600">{totalGeral.ativos}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Em Dia com Pagamentos</p>
                <p className="text-2xl font-bold text-green-600">{totalGeral.emDia}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Receita Mensal Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalGeral.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas por Unidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Métricas por Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metricas.map((metrica, index) => (
                <div key={metrica.unidadeId} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{metrica.nomeUnidade}</h3>
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: cores[index % cores.length] }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Total de Alunos:</span>
                      <Badge variant="outline">{metrica.totalAlunos}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Ativos:</span>
                      <Badge className="bg-green-100 text-green-800">{metrica.alunosAtivos}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Em Dia:</span>
                      <Badge className="bg-blue-100 text-blue-800">{metrica.alunosEmDia}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Atrasados:</span>
                      <Badge variant="destructive">{metrica.alunosAtrasados}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Receita Mensal:</span>
                      <span className="font-bold text-green-600">
                        R$ {metrica.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">% Pagantes:</span>
                      <Badge 
                        className={metrica.percentualPagantes >= 80 ? "bg-green-100 text-green-800" : 
                                  metrica.percentualPagantes >= 60 ? "bg-yellow-100 text-yellow-800" : 
                                  "bg-red-100 text-red-800"}
                      >
                        {metrica.percentualPagantes.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Comparativo de Alunos por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoBarras}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ativos" fill="#10B981" name="Ativos" />
                  <Bar dataKey="emDia" fill="#3B82F6" name="Em Dia" />
                  <Bar dataKey="atrasados" fill="#EF4444" name="Atrasados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Distribuição de Alunos por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficoPizza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosGraficoPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => [
                    `${value} alunos`,
                    `Receita: R$ ${props.payload.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  ]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Ranking de Performance das Unidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metricas
              .sort((a, b) => b.percentualPagantes - a.percentualPagantes)
              .map((metrica, index) => (
                <div key={metrica.unidadeId} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{metrica.nomeUnidade}</h3>
                      <p className="text-sm text-neutral-600">
                        {metrica.alunosEmDia} de {metrica.totalAlunos} alunos em dia
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {metrica.percentualPagantes.toFixed(1)}%
                    </div>
                    <div className="text-sm text-neutral-600">
                      R$ {metrica.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}