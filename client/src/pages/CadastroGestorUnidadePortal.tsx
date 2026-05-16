import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ArrowLeft, UserPlus, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGestorUnidadeSchema, type InsertGestorUnidade, type Filial } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function CadastroGestorUnidadePortal() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: filiais, isLoading: filiaisLoading } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const form = useForm<InsertGestorUnidade>({
    resolver: zodResolver(insertGestorUnidadeSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      telefone: "",
      papel: "gestor",
      ativo: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGestorUnidade) => {
      const response = await apiRequest("POST", "/api/gestores-unidade", data);
      if (!response.ok) {
        throw new Error("Erro ao cadastrar gestor");
      }
      return response.json();
    },
    onSuccess: (gestor) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gestores-unidade"] });
      toast({
        title: "Gestor cadastrado com sucesso!",
        description: `${gestor.nome} foi cadastrado e pode acessar o portal da unidade.`,
      });
      
      // Redirecionar para a página de login da unidade
      setLocation("/portal-unidade");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar gestor",
        description: error.message || "Ocorreu um erro interno",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGestorUnidade) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Sistema
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Cadastro de Gestor de Unidade
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Registre um novo gestor para administrar uma unidade específica
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Dados Pessoais
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo do gestor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="gestor@unidade.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              {...field}
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Senha de acesso"
                              {...field}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Configurações da Unidade */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Configurações da Unidade
                  </h3>

                  <FormField
                    control={form.control}
                    name="filialId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade Responsável</FormLabel>
                        <FormControl>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a unidade" />
                            </SelectTrigger>
                            <SelectContent>
                              {filiaisLoading ? (
                                <SelectItem value="loading" disabled>
                                  Carregando unidades...
                                </SelectItem>
                              ) : (
                                filiais?.map((filial) => (
                                  <SelectItem key={filial.id} value={filial.id.toString()}>
                                    {filial.nome}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="papel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Papel</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o papel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gestor">Gestor</SelectItem>
                              <SelectItem value="supervisor">Supervisor</SelectItem>
                              <SelectItem value="admin_unidade">Administrador da Unidade</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {createMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Cadastrando...
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Cadastrar Gestor
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <div className="mt-6 text-center">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800 mb-2 font-medium">
              📋 Após o cadastro:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• O gestor poderá acessar o portal da unidade em /portal-unidade</li>
              <li>• Terá controle total sobre alunos, professores e turmas da unidade</li>
              <li>• Todos os dados serão sincronizados automaticamente com a matriz</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}