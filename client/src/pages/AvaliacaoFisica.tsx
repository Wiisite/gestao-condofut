import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Target, Activity, TrendingUp, Users, FileText, Calendar, Calculator } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  insertCategoriaTesteSchema, 
  insertTesteSchema, 
  insertAvaliacaoFisicaSchema,
  insertResultadoTesteSchema,
  insertMetaAlunoSchema,
  type CategoriaTeste,
  type TesteWithCategoria,
  type AvaliacaoFisicaComplete,
  type Aluno,
  type Professor
} from "@shared/schema";

export default function AvaliacaoFisica() {
  const [activeTab, setActiveTab] = useState("categorias");
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [selectedAluno, setSelectedAluno] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: categorias = [] } = useQuery<CategoriaTeste[]>({
    queryKey: ["/api/categorias-testes"],
  });

  const { data: testes = [] } = useQuery<TesteWithCategoria[]>({
    queryKey: ["/api/testes"],
  });

  const { data: avaliacoes = [] } = useQuery<AvaliacaoFisicaComplete[]>({
    queryKey: ["/api/avaliacoes-fisicas"],
  });

  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ["/api/alunos"],
  });

  const { data: professores = [] } = useQuery<Professor[]>({
    queryKey: ["/api/professores"],
  });

  // Forms
  const categoriaForm = useForm({
    resolver: zodResolver(insertCategoriaTesteSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      unidadeMedida: "",
      tipoTeste: "fisico",
      ativo: true,
    },
  });

  const testeForm = useForm({
    resolver: zodResolver(insertTesteSchema),
    defaultValues: {
      categoriaId: 0,
      nome: "",
      descricao: "",
      instrucoes: "",
      unidadeMedida: "",
      valorMinimo: 0,
      valorMaximo: 100,
      ativo: true,
    },
  });

  const avaliacaoForm = useForm({
    resolver: zodResolver(insertAvaliacaoFisicaSchema),
    defaultValues: {
      alunoId: 0,
      professorId: 0,
      dataAvaliacao: new Date().toISOString().split('T')[0],
      pesoKg: 0,
      alturaM: 0,
      imc: 0,
      observacoesGerais: "",
      recomendacoes: "",
      proximaAvaliacao: "",
      filialId: 1,
    },
  });

  // Mutations
  const createCategoriaMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/categorias-testes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-testes"] });
      categoriaForm.reset();
      toast({
        title: "Categoria criada",
        description: "A categoria de teste foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar categoria: " + error.message,
        variant: "destructive",
      });
    },
  });

  const createTesteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/testes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testes"] });
      testeForm.reset();
      toast({
        title: "Teste criado",
        description: "O teste foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar teste: " + error.message,
        variant: "destructive",
      });
    },
  });

  const createAvaliacaoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/avaliacoes-fisicas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/avaliacoes-fisicas"] });
      avaliacaoForm.reset();
      toast({
        title: "Avaliação criada",
        description: "A avaliação física foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar avaliação: " + error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitCategoria = (data: any) => {
    createCategoriaMutation.mutate(data);
  };

  const onSubmitTeste = (data: any) => {
    createTesteMutation.mutate(data);
  };

  const onSubmitAvaliacao = (data: any) => {
    // Calculate IMC automatically
    if (data.pesoKg && data.alturaM) {
      data.imc = (data.pesoKg / (data.alturaM * data.alturaM)).toFixed(2);
    }
    createAvaliacaoMutation.mutate(data);
  };

  const testesFiltrados = selectedCategoria 
    ? testes.filter((teste: any) => teste.categoriaId === selectedCategoria)
    : testes;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0847ad]">Sistema de Avaliação Física</h1>
          <p className="text-gray-600">Gestão completa de avaliações físicas dos alunos</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="testes" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Testes</span>
          </TabsTrigger>
          <TabsTrigger value="avaliacoes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Avaliações</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        {/* Categorias Tab */}
        <TabsContent value="categorias" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nova Categoria de Teste
                </CardTitle>
                <CardDescription>
                  Crie categorias para organizar os diferentes tipos de testes físicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...categoriaForm}>
                  <form onSubmit={categoriaForm.handleSubmit(onSubmitCategoria)} className="space-y-4">
                    <FormField
                      control={categoriaForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Categoria</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Resistência, Velocidade, Força" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoriaForm.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descreva o objetivo desta categoria" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={categoriaForm.control}
                        name="unidadeMedida"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade de Medida</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: segundos, metros" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoriaForm.control}
                        name="tipoTeste"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Teste</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fisico">Físico</SelectItem>
                                <SelectItem value="tecnico">Técnico</SelectItem>
                                <SelectItem value="antropometrico">Antropométrico</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#0847ad] hover:bg-[#0847ad]/90"
                      disabled={createCategoriaMutation.isPending}
                    >
                      {createCategoriaMutation.isPending ? "Criando..." : "Criar Categoria"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorias Existentes</CardTitle>
                <CardDescription>
                  {categorias.length} categoria(s) cadastrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categorias.map((categoria: any) => (
                    <div key={categoria.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-[#0847ad]">{categoria.nome}</h4>
                          <p className="text-sm text-gray-600 mt-1">{categoria.descricao}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{categoria.tipoTeste}</Badge>
                            {categoria.unidadeMedida && (
                              <Badge variant="secondary">{categoria.unidadeMedida}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Testes Tab */}
        <TabsContent value="testes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Novo Teste
                </CardTitle>
                <CardDescription>
                  Crie testes específicos dentro de cada categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...testeForm}>
                  <form onSubmit={testeForm.handleSubmit(onSubmitTeste)} className="space-y-4">
                    <FormField
                      control={testeForm.control}
                      name="categoriaId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categorias.map((categoria: any) => (
                                <SelectItem key={categoria.id} value={categoria.id.toString()}>
                                  {categoria.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={testeForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Teste</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Corrida de 20 metros, Flexão de braço" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={testeForm.control}
                      name="instrucoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instruções</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Como executar este teste..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={testeForm.control}
                        name="unidadeMedida"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: seg, rep" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={testeForm.control}
                        name="valorMinimo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Mín.</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={testeForm.control}
                        name="valorMaximo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Máx.</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#0847ad] hover:bg-[#0847ad]/90"
                      disabled={createTesteMutation.isPending}
                    >
                      {createTesteMutation.isPending ? "Criando..." : "Criar Teste"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Testes por Categoria</CardTitle>
                <CardDescription>
                  Filtrar por categoria para visualizar testes específicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select onValueChange={(value) => setSelectedCategoria(value ? parseInt(value) : null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categorias.map((categoria: any) => (
                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testesFiltrados.map((teste: any) => (
                      <div key={teste.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-[#0847ad]">{teste.nome}</h4>
                        <p className="text-sm text-gray-600 mt-1">{teste.instrucoes}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{teste.unidadeMedida}</Badge>
                          <Badge variant="secondary">
                            {teste.valorMinimo} - {teste.valorMaximo}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Avaliações Tab */}
        <TabsContent value="avaliacoes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Nova Avaliação Física
                </CardTitle>
                <CardDescription>
                  Registre uma nova avaliação física para um aluno
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...avaliacaoForm}>
                  <form onSubmit={avaliacaoForm.handleSubmit(onSubmitAvaliacao)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={avaliacaoForm.control}
                        name="alunoId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aluno</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o aluno" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {alunos.map((aluno: any) => (
                                  <SelectItem key={aluno.id} value={aluno.id.toString()}>
                                    {aluno.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={avaliacaoForm.control}
                        name="professorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professor</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o professor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {professores.map((professor: any) => (
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
                    </div>

                    <FormField
                      control={avaliacaoForm.control}
                      name="dataAvaliacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Avaliação</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={avaliacaoForm.control}
                        name="pesoKg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="Ex: 70.5"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={avaliacaoForm.control}
                        name="alturaM"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Altura (m)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="Ex: 1.75"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={avaliacaoForm.control}
                        name="imc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IMC</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="Calculado automaticamente"
                                {...field}
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={avaliacaoForm.control}
                      name="observacoesGerais"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações Gerais</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Observações sobre a avaliação..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={avaliacaoForm.control}
                      name="recomendacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recomendações</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Recomendações para o aluno..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={avaliacaoForm.control}
                      name="proximaAvaliacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Próxima Avaliação</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-[#0847ad] hover:bg-[#0847ad]/90"
                      disabled={createAvaliacaoMutation.isPending}
                    >
                      {createAvaliacaoMutation.isPending ? "Criando..." : "Criar Avaliação"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avaliações Recentes</CardTitle>
                <CardDescription>
                  {avaliacoes.length} avaliação(ões) registrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {avaliacoes.map((avaliacao: any) => (
                    <div key={avaliacao.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-[#0847ad]">
                            {avaliacao.aluno?.nome || "Aluno não encontrado"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Professor: {avaliacao.professor?.nome || "Professor não encontrado"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Data: {new Date(avaliacao.dataAvaliacao).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              Peso: {avaliacao.pesoKg}kg
                            </Badge>
                            <Badge variant="secondary">
                              IMC: {avaliacao.imc}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios Tab */}
        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Categorias</p>
                    <p className="text-2xl font-bold text-[#0847ad]">{categorias.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-[#0847ad]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Testes</p>
                    <p className="text-2xl font-bold text-[#0847ad]">{testes.length}</p>
                  </div>
                  <Target className="h-8 w-8 text-[#0847ad]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avaliações</p>
                    <p className="text-2xl font-bold text-[#0847ad]">{avaliacoes.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-[#0847ad]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Alunos Avaliados</p>
                    <p className="text-2xl font-bold text-[#0847ad]">
                      {new Set(avaliacoes.map((a: any) => a.alunoId)).size}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-[#0847ad]" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progresso dos Alunos</CardTitle>
              <CardDescription>
                Acompanhe o desenvolvimento físico dos alunos ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>Funcionalidade de relatórios em desenvolvimento</p>
                <p className="text-sm">Em breve você poderá visualizar gráficos e estatísticas detalhadas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}