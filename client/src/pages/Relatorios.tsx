import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  SquareUser,
  Target,
  BarChart3,
  PieChart
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Aluno, Professor, Turma, Pagamento } from "@shared/schema";

export default function Relatorios() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [selectedReport, setSelectedReport] = useState("general");

  const { data: alunos, isLoading: loadingAlunos } = useQuery<Aluno[]>({
    queryKey: ["/api/alunos"],
  });

  const { data: professores, isLoading: loadingProfessores } = useQuery<Professor[]>({
    queryKey: ["/api/professores"],
  });

  const { data: turmas, isLoading: loadingTurmas } = useQuery<Turma[]>({
    queryKey: ["/api/turmas"],
  });

  const { data: pagamentos, isLoading: loadingPagamentos } = useQuery<Pagamento[]>({
    queryKey: ["/api/pagamentos"],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case "current-month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "last-month":
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case "last-3-months":
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      case "last-6-months":
        startDate = startOfMonth(subMonths(now, 5));
        endDate = endOfMonth(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    const filteredPagamentos = pagamentos?.filter(p => {
      const paymentDate = new Date(p.dataPagamento);
      return paymentDate >= startDate && paymentDate <= endDate;
    }) || [];

    return { filteredPagamentos, startDate, endDate };
  };

  const generateGeneralReport = () => {
    const { filteredPagamentos } = getFilteredData();
    
    const totalAlunos = alunos?.filter(a => a.ativo).length || 0;
    const totalProfessores = professores?.filter(p => p.ativo).length || 0;
    const totalTurmas = turmas?.filter(t => t.ativo).length || 0;
    
    const totalReceita = filteredPagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
    const totalPagamentos = filteredPagamentos.length;
    const ticketMedio = totalPagamentos > 0 ? totalReceita / totalPagamentos : 0;

    // Age distribution
    const ageGroups = {
      "5-10": 0,
      "11-15": 0,
      "16-20": 0,
      "21+": 0,
    };

    alunos?.forEach(aluno => {
      const age = calculateAge(aluno.dataNascimento);
      if (age >= 5 && age <= 10) ageGroups["5-10"]++;
      else if (age >= 11 && age <= 15) ageGroups["11-15"]++;
      else if (age >= 16 && age <= 20) ageGroups["16-20"]++;
      else if (age >= 21) ageGroups["21+"]++;
    });

    // Payment methods distribution
    const paymentMethods: Record<string, number> = {};
    filteredPagamentos.forEach(p => {
      paymentMethods[p.formaPagamento] = (paymentMethods[p.formaPagamento] || 0) + 1;
    });

    return {
      overview: {
        totalAlunos,
        totalProfessores,
        totalTurmas,
        totalReceita,
        totalPagamentos,
        ticketMedio,
      },
      ageGroups,
      paymentMethods,
    };
  };

  const generateFinancialReport = () => {
    const { filteredPagamentos } = getFilteredData();
    
    const monthlyRevenue: Record<string, number> = {};
    const dailyRevenue: Record<string, number> = {};

    filteredPagamentos.forEach(p => {
      const month = p.mesReferencia;
      const day = format(new Date(p.dataPagamento), "yyyy-MM-dd");
      
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(p.valor);
      dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(p.valor);
    });

    return {
      monthlyRevenue,
      dailyRevenue,
      totalRevenue: Object.values(monthlyRevenue).reduce((sum, val) => sum + val, 0),
    };
  };

  const handleExportReport = () => {
    const reportData = selectedReport === "financial" ? generateFinancialReport() : generateGeneralReport();
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (selectedReport === "general") {
      const data = reportData as ReturnType<typeof generateGeneralReport>;
      csvContent += "Relatório Geral\n\n";
      csvContent += "Métrica,Valor\n";
      csvContent += `Total de Alunos,${data.overview.totalAlunos}\n`;
      csvContent += `Total de Professores,${data.overview.totalProfessores}\n`;
      csvContent += `Total de Turmas,${data.overview.totalTurmas}\n`;
      csvContent += `Receita Total,${formatCurrency(data.overview.totalReceita)}\n`;
      csvContent += `Total de Pagamentos,${data.overview.totalPagamentos}\n`;
      csvContent += `Ticket Médio,${formatCurrency(data.overview.ticketMedio)}\n\n`;
      
      csvContent += "Distribuição por Idade\n";
      csvContent += "Faixa Etária,Quantidade\n";
      Object.entries(data.ageGroups).forEach(([age, count]) => {
        csvContent += `${age} anos,${count}\n`;
      });
    } else {
      const data = reportData as ReturnType<typeof generateFinancialReport>;
      csvContent += "Relatório Financeiro\n\n";
      csvContent += "Mês,Receita\n";
      Object.entries(data.monthlyRevenue).forEach(([month, revenue]) => {
        csvContent += `${month},${formatCurrency(revenue)}\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio-${selectedReport}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = loadingAlunos || loadingProfessores || loadingTurmas || loadingPagamentos;

  const generalReport = generateGeneralReport();
  const financialReport = generateFinancialReport();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Relatórios e Análises</h2>
          <p className="text-neutral-600">Analise o desempenho e métricas da escola</p>
        </div>
        <Button onClick={handleExportReport} className="bg-primary hover:bg-primary/90">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Relatório Geral</SelectItem>
                  <SelectItem value="financial">Relatório Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Mês Atual</SelectItem>
                  <SelectItem value="last-month">Mês Passado</SelectItem>
                  <SelectItem value="last-3-months">Últimos 3 Meses</SelectItem>
                  <SelectItem value="last-6-months">Últimos 6 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {selectedReport === "general" && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Total de Alunos</p>
                        <p className="text-2xl font-bold text-neutral-800">
                          {generalReport.overview.totalAlunos}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Total de Professores</p>
                        <p className="text-2xl font-bold text-neutral-800">
                          {generalReport.overview.totalProfessores}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <SquareUser className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Total de Turmas</p>
                        <p className="text-2xl font-bold text-neutral-800">
                          {generalReport.overview.totalTurmas}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Age Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="w-5 h-5 mr-2" />
                      Distribuição por Idade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(generalReport.ageGroups).map(([age, count]) => (
                        <div key={age} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                            <span className="font-medium">{age} anos</span>
                          </div>
                          <Badge variant="secondary">{count} alunos</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Formas de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(generalReport.paymentMethods).map(([method, count]) => (
                        <div key={method} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-accent rounded-full"></div>
                            <span className="font-medium">{method}</span>
                          </div>
                          <Badge variant="secondary">{count} pagamentos</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {selectedReport === "financial" && (
            <>
              {/* Financial Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Receita Total</p>
                        <p className="text-2xl font-bold text-neutral-800">
                          {formatCurrency(financialReport.totalRevenue)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Total de Pagamentos</p>
                        <p className="text-2xl font-bold text-neutral-800">
                          {generalReport.overview.totalPagamentos}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Ticket Médio</p>
                        <p className="text-2xl font-bold text-neutral-800">
                          {formatCurrency(generalReport.overview.ticketMedio)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Receita por Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(financialReport.monthlyRevenue).map(([month, revenue]) => (
                      <div key={month} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span className="font-medium">
                            {format(new Date(month + "-01"), "MMMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <span className="font-bold text-green-600">
                          {formatCurrency(revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
