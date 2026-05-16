import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar,
  Search, 
  Download,
  Filter,
  Users,
  ClipboardList,
  CheckCircle,
  XCircle,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { 
  TurmaWithProfessor, 
  AlunoWithFilial, 
  Presenca
} from "@shared/schema";

interface PresencaDetalhada extends Presenca {
  aluno: AlunoWithFilial;
  turma: TurmaWithProfessor;
}

export default function RelatorioPresencas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [turmaFiltro, setTurmaFiltro] = useState<string>("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  const { data: turmas } = useQuery<TurmaWithProfessor[]>({
    queryKey: ["/api/turmas"],
  });

  const { data: presencas, isLoading: loadingPresencas } = useQuery<PresencaDetalhada[]>({
    queryKey: ["/api/presencas/detalhadas"],
  });

  const presencasFiltradas = presencas?.filter(presenca => {
    const matchesSearch = presenca.aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         presenca.turma.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTurma = turmaFiltro === "todas" || presenca.turmaId.toString() === turmaFiltro;
    
    const matchesStatus = statusFiltro === "todos" || 
                         (statusFiltro === "presente" && presenca.presente) ||
                         (statusFiltro === "ausente" && !presenca.presente);

    const matchesDataInicio = !dataInicio || presenca.data >= dataInicio;
    const matchesDataFim = !dataFim || presenca.data <= dataFim;

    return matchesSearch && matchesTurma && matchesStatus && matchesDataInicio && matchesDataFim;
  }) || [];

  const estatisticas = presencas ? {
    totalRegistros: presencas.length,
    totalPresentes: presencas.filter(p => p.presente).length,
    totalAusentes: presencas.filter(p => !p.presente).length,
    percentualPresenca: presencas.length > 0 
      ? Math.round((presencas.filter(p => p.presente).length / presencas.length) * 100)
      : 0
  } : null;

  const handleExportarCSV = () => {
    const csvData = presencasFiltradas.map(presenca => ({
      Data: format(new Date(presenca.data), "dd/MM/yyyy"),
      Aluno: presenca.aluno.nome,
      Turma: presenca.turma.nome,
      Professor: presenca.turma.professor?.nome || "N/A",
      Status: presenca.presente ? "Presente" : "Ausente",
      Observacoes: presenca.observacoes || ""
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_presencas_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportarPDF = () => {
    const doc = new jsPDF();
    
    // Título do documento
    doc.setFontSize(20);
    doc.text("Relatório de Presenças", 20, 20);
    
    // Informações gerais
    doc.setFontSize(12);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 35);
    
    // Estatísticas
    if (estatisticas) {
      doc.text(`Total de Registros: ${estatisticas.totalRegistros}`, 20, 45);
      doc.text(`Presenças: ${estatisticas.totalPresentes}`, 20, 55);
      doc.text(`Ausências: ${estatisticas.totalAusentes}`, 20, 65);
      doc.text(`Percentual de Presença: ${estatisticas.percentualPresenca}%`, 20, 75);
    }

    // Tabela de dados
    const tableData = presencasFiltradas.map(presenca => [
      format(new Date(presenca.data), "dd/MM/yyyy"),
      presenca.aluno.nome,
      presenca.turma.nome,
      presenca.turma.professor?.nome || "N/A",
      presenca.presente ? "Presente" : "Ausente",
      presenca.observacoes || ""
    ]);

    autoTable(doc, {
      head: [["Data", "Aluno", "Turma", "Professor", "Status", "Observações"]],
      body: tableData,
      startY: 90,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Data
        1: { cellWidth: 40 }, // Aluno
        2: { cellWidth: 30 }, // Turma
        3: { cellWidth: 35 }, // Professor
        4: { cellWidth: 25 }, // Status
        5: { cellWidth: 35 }, // Observações
      },
    });

    // Salvar o PDF
    doc.save(`relatorio_presencas_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Relatório de Presenças</h2>
          <p className="text-neutral-600">Acompanhe a frequência dos alunos nas turmas</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleExportarCSV} 
            disabled={presencasFiltradas.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button 
            onClick={handleExportarPDF} 
            disabled={presencasFiltradas.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Total de Registros</p>
                  <p className="text-2xl font-bold text-neutral-900">{estatisticas.totalRegistros}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Presenças</p>
                  <p className="text-2xl font-bold text-green-600">{estatisticas.totalPresentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Ausências</p>
                  <p className="text-2xl font-bold text-red-600">{estatisticas.totalAusentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">% Presença</p>
                  <p className="text-2xl font-bold text-purple-600">{estatisticas.percentualPresenca}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Buscar aluno ou turma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={turmaFiltro} onValueChange={setTurmaFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmas?.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id.toString()}>
                    {turma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="presente">Presente</SelectItem>
                <SelectItem value="ausente">Ausente</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data início"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data fim"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setTurmaFiltro("todas");
                setStatusFiltro("todos");
                setDataInicio("");
                setDataFim("");
              }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Presenças */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Presença</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPresencas ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : presencasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500">Nenhum registro de presença encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presencasFiltradas.map((presenca) => (
                    <TableRow key={`${presenca.id}-${presenca.alunoId}-${presenca.data}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
                          {format(new Date(presenca.data), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {presenca.aluno.nome}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {presenca.turma.nome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {presenca.turma.professor?.nome || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={presenca.presente ? "default" : "destructive"}>
                          {presenca.presente ? "Presente" : "Ausente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {presenca.observacoes || "-"}
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