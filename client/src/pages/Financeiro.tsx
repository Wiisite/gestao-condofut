import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Search, Plus, Trash2, Calendar, CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { Pagamento, Aluno } from "@shared/schema";
import PagamentoForm from "@/components/forms/PagamentoForm";

export default function Financeiro() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pagamentos, isLoading: loadingPagamentos } = useQuery<Pagamento[]>({
    queryKey: ["/api/pagamentos"],
  });

  const { data: alunos } = useQuery<Aluno[]>({
    queryKey: ["/api/alunos"],
  });

  const deletePagamentoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pagamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sucesso",
        description: "Pagamento removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredPagamentos = pagamentos?.filter((pagamento) => {
    const aluno = alunos?.find(a => a.id === pagamento.alunoId);
    const matchesSearch = aluno?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pagamento.formaPagamento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = !filterMonth || filterMonth === "all" || pagamento.mesReferencia === filterMonth;
    return matchesSearch && matchesMonth;
  }) || [];

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este pagamento?")) {
      deletePagamentoMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const getAlunoNome = (alunoId: number) => {
    const aluno = alunos?.find(a => a.id === alunoId);
    return aluno?.nome || "Aluno não encontrado";
  };

  const getPaymentMethodColor = (method: string) => {
    const colors = {
      "PIX": "bg-green-100 text-green-800",
      "Dinheiro": "bg-blue-100 text-blue-800",
      "Cartão": "bg-purple-100 text-purple-800",
      "Transferência": "bg-orange-100 text-orange-800",
    };
    return colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const calculateTotals = () => {
    const total = filteredPagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTotal = filteredPagamentos
      .filter(p => p.mesReferencia === currentMonth)
      .reduce((sum, p) => sum + Number(p.valor), 0);
    
    return { total, monthlyTotal };
  };

  const { total, monthlyTotal } = calculateTotals();

  // Generate month options for filter
  const getMonthOptions = () => {
    const months = [];
    const current = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = format(date, "MMMM yyyy", { locale: ptBR });
      months.push({ value, label });
    }
    return months;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Controle Financeiro</h2>
          <p className="text-neutral-600">Gerencie pagamentos e mensalidades</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Novo Pagamento</DialogTitle>
            </DialogHeader>
            <PagamentoForm onSuccess={handleDialogClose} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Arrecadado</p>
                <p className="text-2xl font-bold text-neutral-800">{formatCurrency(total)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-600 font-medium">
                {filteredPagamentos.length} pagamentos
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-neutral-800">{formatCurrency(monthlyTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-neutral-400">Mês atual</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {formatCurrency(filteredPagamentos.length > 0 ? total / filteredPagamentos.length : 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-neutral-400">Por pagamento</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Buscar por aluno ou forma de pagamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPagamentos ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredPagamentos.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">
                {searchTerm || filterMonth ? "Nenhum pagamento encontrado" : "Nenhum pagamento registrado"}
              </h3>
              <p className="text-neutral-500 mb-4">
                {searchTerm || filterMonth
                  ? "Tente ajustar os filtros de busca." 
                  : "Comece registrando o primeiro pagamento."
                }
              </p>
              {!searchTerm && !filterMonth && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Primeiro Pagamento
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Mês Referência</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagamentos.map((pagamento) => (
                    <TableRow key={pagamento.id}>
                      <TableCell>
                        <p className="font-medium">{getAlunoNome(pagamento.alunoId!)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-semibold text-green-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatCurrency(pagamento.valor)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
                          {format(new Date(pagamento.mesReferencia + "-01"), "MMMM yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(pagamento.formaPagamento)}>
                          <CreditCard className="w-3 h-3 mr-1" />
                          {pagamento.formaPagamento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-neutral-600 max-w-32 truncate">
                          {pagamento.observacoes || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pagamento.id)}
                          disabled={deletePagamentoMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
