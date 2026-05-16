import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTurmaSchema, type TurmaWithProfessor, type InsertTurma, type Professor, type Filial } from "@shared/schema";
import { z } from "zod";

const formSchema = insertTurmaSchema.extend({
  professorId: z.number().optional(),
  filialId: z.number().optional(),
  capacidadeMaxima: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TurmaFormProps {
  turma?: TurmaWithProfessor | null;
  onSuccess: () => void;
}

const categorias = [
  "Baby fut", 
  "Sub 07/08", 
  "Sub 09/10", 
  "Sub 11/12", 
  "Sub 13/14", 
  "Sub 15 á 17"
];
const diasSemana = [
  { id: "Segunda", label: "Segunda-feira" },
  { id: "Terça", label: "Terça-feira" },
  { id: "Quarta", label: "Quarta-feira" },
  { id: "Quinta", label: "Quinta-feira" },
  { id: "Sexta", label: "Sexta-feira" },
  { id: "Sábado", label: "Sábado" },
  { id: "Domingo", label: "Domingo" },
];

export default function TurmaForm({ turma, onSuccess }: TurmaFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: professores } = useQuery<Professor[]>({
    queryKey: ["/api/professores"],
  });

  const { data: filiais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: turma?.nome || "",
      categoria: turma?.categoria || "",
      professorId: turma?.professorId || undefined,
      filialId: turma?.filialId || undefined,
      horario: turma?.horario || "",
      diasSemana: turma?.diasSemana || "",
      capacidadeMaxima: turma?.capacidadeMaxima || 20,
      ativo: Boolean(turma?.ativo ?? true),
    },
  });

  const selectedDias = form.watch("diasSemana")?.split(",").filter(Boolean) || [];

  const createMutation = useMutation({
    mutationFn: async (data: InsertTurma) => {
      const response = await apiRequest("POST", "/api/turmas", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turmas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sucesso",
        description: "Turma cadastrada com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar turma. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertTurma>) => {
      const response = await apiRequest("PUT", `/api/turmas/${turma!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turmas"] });
      toast({
        title: "Sucesso",
        description: "Turma atualizada com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar turma. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDiaChange = (diaId: string, checked: boolean) => {
    const currentDias = form.getValues("diasSemana")?.split(",").filter(Boolean) || [];
    let newDias;
    
    if (checked) {
      newDias = [...currentDias, diaId];
    } else {
      newDias = currentDias.filter(d => d !== diaId);
    }
    
    form.setValue("diasSemana", newDias.join(","));
  };

  const onSubmit = (data: FormData) => {
    const submitData: InsertTurma = {
      ...data,
      professorId: data.professorId || null,
      horario: data.horario || null,
      diasSemana: data.diasSemana || null,
    };

    if (turma) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Turma *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Infantil A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
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
            name="professorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professor Responsável</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um professor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {professores?.filter(p => p.ativo).map((professor) => (
                      <SelectItem key={professor.id} value={professor.id.toString()}>
                        {professor.nome}
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
            name="filialId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidades</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filiais?.filter(f => f.ativa).map((filial) => (
                      <SelectItem key={filial.id} value={filial.id.toString()}>
                        {filial.nome}
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
            name="horario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 14:00 - 15:30" onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacidadeMaxima"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade Máxima</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="20" 
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="diasSemana"
          render={() => (
            <FormItem>
              <FormLabel>Dias da Semana</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {diasSemana.map((dia) => (
                  <div key={dia.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={dia.id}
                      checked={selectedDias.includes(dia.id)}
                      onCheckedChange={(checked) => handleDiaChange(dia.id, checked as boolean)}
                    />
                    <label
                      htmlFor={dia.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {dia.label}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status Ativo</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Determina se a turma está ativa no sistema
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? "Salvando..." : turma ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
