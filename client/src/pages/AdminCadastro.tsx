import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation, useSearch } from "wouter";

const cadastroSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type CadastroData = z.infer<typeof cadastroSchema>;

export default function AdminCadastro() {
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  
  // Extrair token da URL
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  // Verificar se o convite é válido
  const { data: inviteData, isLoading: checkingInvite, error: inviteError } = useQuery({
    queryKey: ["/api/admin/verify-invite", token],
    queryFn: async () => {
      if (!token) throw new Error("Token não fornecido");
      const response = await fetch(`/api/admin/verify-invite?token=${token}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Convite inválido");
      }
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  const form = useForm<CadastroData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: "",
      email: inviteData?.email || "",
      senha: "",
      confirmarSenha: "",
    },
  });

  // Atualizar email quando o convite for carregado
  useEffect(() => {
    if (inviteData?.email) {
      form.setValue("email", inviteData.email);
    }
  }, [inviteData, form]);

  const cadastroMutation = useMutation({
    mutationFn: async (data: CadastroData) => {
      const response = await apiRequest("POST", "/api/admin/register-invite", {
        token,
        nome: data.nome,
        email: data.email,
        senha: data.senha,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você já pode fazer login.",
      });
      navigate("/admin-login");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CadastroData) => {
    cadastroMutation.mutate(data);
  };

  // Sem token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Link Inválido</h2>
            <p className="text-gray-500 mt-2">
              Este link de convite não é válido. Solicite um novo convite ao administrador.
            </p>
            <Button className="mt-4" onClick={() => navigate("/admin-login")}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificando convite
  if (checkingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Verificando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convite inválido ou expirado
  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Convite Inválido</h2>
            <p className="text-gray-500 mt-2">
              {(inviteError as Error).message || "Este convite não é válido ou já expirou."}
            </p>
            <Button className="mt-4" onClick={() => navigate("/admin-login")}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Cadastro de Administrador
          </CardTitle>
          <p className="text-gray-600">
            Complete seu cadastro para acessar o sistema
          </p>
          {inviteData?.papel && (
            <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Papel: {inviteData.papel === "super_admin" ? "Super Administrador" : "Administrador"}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Seu nome completo"
                        disabled={cadastroMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        disabled={cadastroMutation.isPending || !!inviteData?.email}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Crie uma senha segura"
                          disabled={cadastroMutation.isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        disabled={cadastroMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={cadastroMutation.isPending}
              >
                {cadastroMutation.isPending ? "Cadastrando..." : "Criar Conta"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
