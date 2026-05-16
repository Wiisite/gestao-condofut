import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAlunoSchema, type InsertAluno } from "@shared/schema";
import { z } from "zod";

const alunoFormSchema = insertAlunoSchema.extend({
  dataNascimento: z.string().optional(),
  email: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

const responsavelFormSchema = z.object({
  nomeResponsavel: z.string().min(1, "Nome do responsável é obrigatório"),
  cpfResponsavel: z.string().optional(),
  emailResponsavel: z.string().email("Email inválido").optional().or(z.literal("")),
  telefoneResponsavel: z.string().min(1, "Telefone do responsável é obrigatório"),
  alunos: z.array(alunoFormSchema).min(1, "Pelo menos um aluno deve ser cadastrado"),
});

type FormData = z.infer<typeof responsavelFormSchema>;

interface CadastroResponsavelFormProps {
  onSuccess: () => void;
}

export default function CadastroResponsavelForm({ onSuccess }: CadastroResponsavelFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(responsavelFormSchema),
    defaultValues: {
      nomeResponsavel: "",
      cpfResponsavel: "",
      emailResponsavel: "",
      telefoneResponsavel: "",
      alunos: [
        {
          nome: "",
          email: "",
          telefone: "",
          dataNascimento: "",
          endereco: "",
          bairro: "",
          cep: "",
          cidade: "",
          estado: "",
          nomeResponsavel: "",
          telefoneResponsavel: "",
          ativo: true,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "alunos",
  });

  const createMultipleAlunosMutation = useMutation({
    mutationFn: async (alunos: InsertAluno[]) => {
      const results = [];
      for (const aluno of alunos) {
        const response = await apiRequest("POST", "/api/alunos", aluno);
        const result = await response.json();
        results.push(result);
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sucesso",
        description: `${results.length} aluno(s) cadastrado(s) com sucesso.`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar alunos. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const addAluno = () => {
    const responsavelData = form.getValues();
    append({
      nome: "",
      email: "",
      telefone: "",
      dataNascimento: "",
      endereco: "",
      bairro: "",
      cep: "",
      cidade: "",
      estado: "",
      nomeResponsavel: responsavelData.nomeResponsavel,
      telefoneResponsavel: responsavelData.telefoneResponsavel,
      ativo: true,
    });
  };

  const removeAluno = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const alunosToCreate: InsertAluno[] = data.alunos.map(aluno => ({
        ...aluno,
        dataNascimento: aluno.dataNascimento || null,
        email: aluno.email || null,
        telefone: aluno.telefone || null,
        endereco: aluno.endereco || null,
        bairro: aluno.bairro || null,
        cep: aluno.cep || null,
        cidade: aluno.cidade || null,
        estado: aluno.estado || null,
        nomeResponsavel: data.nomeResponsavel,
        telefoneResponsavel: data.telefoneResponsavel,
      }));

      await createMultipleAlunosMutation.mutateAsync(alunosToCreate);
    } catch (error) {
      console.error("Erro ao cadastrar alunos:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateResponsavelDataInAlunos = () => {
    const responsavelData = form.getValues();
    const currentAlunos = form.getValues("alunos");
    
    currentAlunos.forEach((_, index) => {
      form.setValue(`alunos.${index}.nomeResponsavel`, responsavelData.nomeResponsavel);
      form.setValue(`alunos.${index}.telefoneResponsavel`, responsavelData.telefoneResponsavel);

    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados do Responsável */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Dados do Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nomeResponsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo do Responsável *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite o nome completo" 
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          updateResponsavelDataInAlunos();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefoneResponsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Responsável *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(11) 99999-9999" 
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          updateResponsavelDataInAlunos();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpfResponsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Responsável</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="000.000.000-00" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailResponsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Responsável</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="email@exemplo.com" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


          </CardContent>
        </Card>

        {/* Dados dos Alunos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Alunos ({fields.length})
              </CardTitle>
              <Button type="button" onClick={addAluno} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Aluno
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="relative border rounded-lg p-4 bg-neutral-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Aluno {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAluno(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`alunos.${index}.nome`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome completo do aluno" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`alunos.${index}.dataNascimento`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`alunos.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail do Aluno</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`alunos.${index}.telefone`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Aluno</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`alunos.${index}.endereco`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o endereço completo" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name={`alunos.${index}.bairro`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o bairro" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`alunos.${index}.cep`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`alunos.${index}.cidade`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite a cidade" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`alunos.${index}.estado`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" maxLength={2} {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? "Cadastrando..." : `Cadastrar ${fields.length} Aluno(s)`}
          </Button>
        </div>
      </form>
    </Form>
  );
}