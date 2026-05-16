import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPagamentoSchema, type InsertPagamento, type Aluno } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

const formSchema = insertPagamentoSchema.extend({
  alunoId: z.number(),
  dataPagamento: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface PagamentoFormProps {
  onSuccess: () => void;
}

const formasPagamento = [
  "PIX",
  "Dinheiro", 
  "Cartão",
  "Transferência",
];

export default function PagamentoForm({ onSuccess }: PagamentoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alunos } = useQuery<Aluno[]>({
    queryKey: ["/api/alunos"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alunoId: undefined,
      valor: "",
      mesReferencia: format(new Date(), "yyyy-MM"),
      dataPagamento: format(new Date(), "yyyy-MM-dd"),
      formaPagamento: "",
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPagamento) => {
      const response = await apiRequest("POST", "/api/pagamentos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData: InsertPagamento = {
      ...data,
      observacoes: data.observacoes || null,
    };

    createMutation.mutate(submitData);
  };

  const isLoading = createMutation.isPending;

  // Generate month options
  const getMonthOptions = () => {
    const months = [];
    const current = new Date();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                       "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    for (let i = -2; i <= 3; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() + i, 1);
      const value = format(date, "yyyy-MM");
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      months.push({ value, label });
    }
    return months;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="alunoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aluno *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {alunos?.filter(a => a.ativo).map((aluno) => (
                      <SelectItem key={aluno.id} value={aluno.id.toString()}>
                        {aluno.nome}
                      </SelectItem>
                    )) || []}
                    {(!alunos || alunos.filter(a => a.ativo).length === 0) && (
                      <SelectItem value="no-students" disabled>
                        Nenhum aluno ativo encontrado
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mesReferencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mês de Referência *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getMonthOptions().map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataPagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do Pagamento *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="formaPagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formasPagamento.map((forma) => (
                        <SelectItem key={forma} value={forma}>
                          {forma}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações adicionais sobre o pagamento"
                  className="min-h-[80px]"
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? "Registrando..." : "Registrar Pagamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
