import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CreditCard, Receipt, ArrowLeft, Download, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Pagamento, AlunoWithFilial } from "@shared/schema";

interface ExtratoAlunoProps {
  aluno: AlunoWithFilial;
  onBack: () => void;
}

export default function ExtratoAluno({ aluno, onBack }: ExtratoAlunoProps) {
  const { data: pagamentos, isLoading } = useQuery<Pagamento[]>({
    queryKey: [`/api/pagamentos/aluno/${aluno.id}`],
  });

  const calcularTotal = () => {
    return pagamentos?.reduce((total, pagamento) => total + parseFloat(pagamento.valor), 0) || 0;
  };

  const formatarMesReferencia = (mesRef: string) => {
    const [ano, mes] = mesRef.split('-');
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  };

  const getFormaPagamentoBadge = (forma: string) => {
    const cores: Record<string, string> = {
      'PIX': 'bg-green-100 text-green-800',
      'Dinheiro': 'bg-blue-100 text-blue-800',
      'Cartão': 'bg-purple-100 text-purple-800',
      'Débito': 'bg-orange-100 text-orange-800',
      'Transferência': 'bg-teal-100 text-teal-800'
    };
    
    return cores[forma] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">Extrato de Pagamentos</h2>
            <p className="text-neutral-600">{aluno.nome}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => window.location.href = '/financeiro'}>
            <DollarSign className="w-4 h-4 mr-2" />
            Ir para Financeiro
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Informações do Aluno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Dados do Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Nome Completo</p>
              <p className="font-medium">{aluno.nome}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Unidade</p>
              <p className="font-medium">{aluno.filial?.nome || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Status de Pagamento</p>
              <Badge 
                variant={aluno.statusPagamento?.emDia ? "default" : "destructive"}
                className={aluno.statusPagamento?.emDia ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {aluno.statusPagamento?.emDia ? "Em Dia" : "Atrasado"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                R$ {calcularTotal().toFixed(2).replace('.', ',')}
              </p>
              <p className="text-sm text-neutral-500">Total Pago</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {pagamentos?.length || 0}
              </p>
              <p className="text-sm text-neutral-500">Pagamentos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {aluno.statusPagamento?.ultimoPagamento 
                  ? formatarMesReferencia(aluno.statusPagamento.ultimoPagamento)
                  : "Nenhum"
                }
              </p>
              <p className="text-sm text-neutral-500">Último Mês</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                R$ 150,00
              </p>
              <p className="text-sm text-neutral-500">Mensalidade</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : !pagamentos || pagamentos.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">
                Nenhum pagamento registrado
              </h3>
              <p className="text-neutral-500">
                O histórico de pagamentos aparecerá aqui quando houver registros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês Referência</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos
                    .sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia))
                    .map((pagamento) => (
                    <TableRow key={pagamento.id}>
                      <TableCell>
                        <div className="font-medium">
                          {formatarMesReferencia(pagamento.mesReferencia)}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {pagamento.mesReferencia}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
                          {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          R$ {parseFloat(pagamento.valor).toFixed(2).replace('.', ',')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getFormaPagamentoBadge(pagamento.formaPagamento)}
                        >
                          {pagamento.formaPagamento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pagamento.observacoes || (
                          <span className="text-neutral-400">-</span>
                        )}
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