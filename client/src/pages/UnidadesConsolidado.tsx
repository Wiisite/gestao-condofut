import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  Users,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Clock,
  Eye,
  Home,
  Building,
  SquareUser
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface Filial {
  id: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  horarioFuncionamento: string | null;
  responsavel: string | null;
  fotoFundoUrl: string | null;
  ativa: boolean | null;
  isMatriz: boolean | null;
  totalAlunos?: number;
  totalProfessores?: number;
  totalTurmas?: number;
  receitaMensal?: number;
}

interface FormData {
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  horarioFuncionamento: string;
  responsavel: string;
  fotoFundoUrl: string;
  ativa: boolean;
  isMatriz: boolean;
}

const initialFormData: FormData = {
  nome: "",
  endereco: "",
  telefone: "",
  email: "",
  horarioFuncionamento: "",
  responsavel: "",
  fotoFundoUrl: "",
  ativa: true,
  isMatriz: false,
};

export default function UnidadesConsolidado() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [activeTab, setActiveTab] = useState("lista");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar unidades com detalhes
  const { data: filiais = [], isLoading } = useQuery<Filial[]>({
    queryKey: ["/api/filiais/detalhadas"],
  });

  // Verificar se existe matriz
  const matriz = filiais.find(f => f.isMatriz);
  const temMatriz = !!matriz;

  // Criar/Atualizar unidade
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editingFilial) {
        return await apiRequest("PUT", `/api/filiais/${editingFilial.id}`, data);
      }
      return await apiRequest("POST", "/api/filiais", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      queryClient.invalidateQueries({ queryKey: ["/api/filiais/detalhadas"] });
      handleCloseDialog();
      toast({
        title: editingFilial ? "Unidade atualizada" : "Unidade criada",
        description: editingFilial 
          ? "Unidade atualizada com sucesso!" 
          : "Nova unidade criada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a unidade.",
        variant: "destructive",
      });
    },
  });

  // Deletar unidade
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/filiais/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      queryClient.invalidateQueries({ queryKey: ["/api/filiais/detalhadas"] });
      toast({
        title: "Unidade removida",
        description: "Unidade removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a unidade.",
        variant: "destructive",
      });
    },
  });

  const filteredFiliais = filiais.filter((filial) =>
    filial.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filial.endereco?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (filial?: Filial, isMatriz = false) => {
    if (filial) {
      setEditingFilial(filial);
      setFormData({
        nome: filial.nome,
        endereco: filial.endereco || "",
        telefone: filial.telefone || "",
        email: filial.email || "",
        horarioFuncionamento: filial.horarioFuncionamento || "",
        responsavel: filial.responsavel || "",
        fotoFundoUrl: filial.fotoFundoUrl || "",
        ativa: filial.ativa ?? true,
        isMatriz: filial.isMatriz ?? false,
      });
    } else {
      setEditingFilial(null);
      setFormData({ ...initialFormData, isMatriz });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFilial(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome da unidade é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: number, nome: string) => {
    if (confirm(`Tem certeza que deseja remover "${nome}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Estatísticas gerais
  const totalAlunos = filiais.reduce((acc, f) => acc + (f.totalAlunos || 0), 0);
  const totalProfessores = filiais.reduce((acc, f) => acc + (f.totalProfessores || 0), 0);
  const receitaTotal = filiais.reduce((acc, f) => acc + (f.receitaMensal || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Unidades</h2>
          <p className="text-neutral-600">Gerencie a matriz e filiais da escola</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Unidade
          </Button>
        </div>
      </div>

      {/* Estatísticas gerais removidas ou mantidas conforme necessário */}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total de Unidades</p>
                <p className="text-2xl font-bold">{filiais.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total de Alunos</p>
                <p className="text-2xl font-bold">{totalAlunos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <SquareUser className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total de Professores</p>
                <p className="text-2xl font-bold">{totalProfessores}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Receita Total</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista de Unidades</TabsTrigger>
          <TabsTrigger value="cards">Visão em Cards</TabsTrigger>
        </TabsList>

        {/* Busca */}
        <div className="my-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Buscar unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista em Tabela */}
        <TabsContent value="lista">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-center">Alunos</TableHead>
                    <TableHead className="text-center">Professores</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiliais.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                        Nenhuma unidade encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFiliais.map((filial) => (
                      <TableRow key={filial.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {filial.isMatriz ? (
                              <Home className="w-4 h-4 text-green-600" />
                            ) : (
                              <Building className="w-4 h-4 text-blue-600" />
                            )}
                            <div>
                              <p className="font-medium">{filial.nome}</p>
                              {filial.isMatriz && (
                                <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                                  Matriz
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-neutral-600">
                            <MapPin className="w-3 h-3" />
                            {filial.endereco || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {filial.telefone && (
                              <div className="flex items-center gap-1 text-neutral-600">
                                <Phone className="w-3 h-3" />
                                {filial.telefone}
                              </div>
                            )}
                            {filial.email && (
                              <div className="flex items-center gap-1 text-neutral-600">
                                <Mail className="w-3 h-3" />
                                {filial.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{filial.totalAlunos || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{filial.totalProfessores || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={filial.ativa !== false ? "default" : "secondary"}>
                            {filial.ativa !== false ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/unidade/${filial.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenDialog(filial)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(filial.id, filial.nome)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visão em Cards */}
        <TabsContent value="cards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiliais.map((filial) => (
              <Card key={filial.id} className={filial.isMatriz ? "border-green-300" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {filial.isMatriz ? (
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Home className="w-5 h-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{filial.nome}</CardTitle>
                        {filial.isMatriz && (
                          <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                            Matriz
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={filial.ativa !== false ? "default" : "secondary"}>
                      {filial.ativa !== false ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filial.endereco && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="w-4 h-4" />
                      {filial.endereco}
                    </div>
                  )}
                  {filial.telefone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Phone className="w-4 h-4" />
                      {filial.telefone}
                    </div>
                  )}
                  {filial.horarioFuncionamento && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="w-4 h-4" />
                      {filial.horarioFuncionamento}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{filial.totalAlunos || 0}</p>
                      <p className="text-xs text-neutral-500">Alunos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{filial.totalProfessores || 0}</p>
                      <p className="text-xs text-neutral-500">Professores</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(filial.receitaMensal || 0)}
                      </p>
                      <p className="text-xs text-neutral-500">Receita</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Link href={`/unidade/${filial.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenDialog(filial)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <>
                  <Building className="w-5 h-5 text-blue-600" />
                  {editingFilial ? "Editar Unidade" : "Nova Unidade"}
                </>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Unidade *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder={formData.isMatriz ? "Ex: Escola de Futebol - Matriz" : "Ex: Filial Centro"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@escola.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario">Horário de Funcionamento</Label>
              <Input
                id="horario"
                value={formData.horarioFuncionamento}
                onChange={(e) => setFormData({ ...formData, horarioFuncionamento: e.target.value })}
                placeholder="Ex: Seg-Sex 08:00-18:00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                placeholder="Nome do responsável pela unidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fotoFundoUrl">Foto de Fundo (Portal Público)</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    id="fotoFundoUrl"
                    value={formData.fotoFundoUrl}
                    onChange={(e) => setFormData({ ...formData, fotoFundoUrl: e.target.value })}
                    placeholder="URL da imagem (ex: https://...)"
                    className="flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, fotoFundoUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Button type="button" variant="outline" size="sm">
                      Upload
                    </Button>
                  </div>
                </div>
                {formData.fotoFundoUrl && (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                    <img src={formData.fotoFundoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={() => setFormData({ ...formData, fotoFundoUrl: "" })}
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 italic">Insira uma URL ou faça upload de uma foto do computador.</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="ativa"
                  checked={formData.ativa}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
                />
                <Label htmlFor="ativa">Unidade Ativa</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isMatriz"
                  checked={formData.isMatriz}
                  onCheckedChange={(checked) => setFormData({ ...formData, isMatriz: checked })}
                />
                <Label htmlFor="isMatriz">Definir como Matriz</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
