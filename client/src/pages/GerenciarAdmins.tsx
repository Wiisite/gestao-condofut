import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Users, Shield, Copy, Link, Trash2, Check, X } from "lucide-react";

interface AdminUser {
  id: number;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  createdAt: string;
  ultimoLogin: string | null;
}

interface AdminInvite {
  id: number;
  token: string;
  email: string | null;
  papel: string;
  usado: boolean;
  ativo: boolean;
  expiraEm: string | null;
  createdAt: string;
}

export default function GerenciarAdmins() {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ nome: "", email: "", senha: "", papel: "admin" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePapel, setInvitePapel] = useState("admin");
  const [inviteDiasValidade, setInviteDiasValidade] = useState("7");
  const [generatedLink, setGeneratedLink] = useState("");

  // Verificar se é super_admin
  const isSuperAdmin = user?.papel === "super_admin";

  // Buscar lista de admins
  const { data: admins, isLoading: loadingAdmins } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isSuperAdmin,
  });

  // Buscar convites
  const { data: invites, isLoading: loadingInvites } = useQuery<AdminInvite[]>({
    queryKey: ["/api/admin/invites"],
    enabled: isSuperAdmin,
  });

  // Criar novo admin
  const createAdminMutation = useMutation({
    mutationFn: async (data: typeof newAdmin) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Admin criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
      setNewAdmin({ nome: "", email: "", senha: "", papel: "admin" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar admin", description: error.message, variant: "destructive" });
    },
  });

  // Gerar link de convite
  const createInviteMutation = useMutation({
    mutationFn: async (data: { email?: string; papel: string; diasValidade?: number }) => {
      const response = await apiRequest("POST", "/api/admin/invites", data);
      return response.json();
    },
    onSuccess: (data) => {
      const link = `${window.location.origin}/admin/cadastro?token=${data.token}`;
      setGeneratedLink(link);
      toast({ title: "Link de convite gerado!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invites"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao gerar convite", description: error.message, variant: "destructive" });
    },
  });

  // Ativar/Desativar admin
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}`, { ativo });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Status atualizado!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  // Excluir convite
  const deleteInviteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/invites/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Convite excluído!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invites"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  // Ativar/Desativar convite
  const toggleInviteMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/invites/${id}`, { ativo });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Status do convite atualizado!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invites"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar convite", description: error.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copiado!" });
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Acesso Restrito</h2>
            <p className="text-gray-500 mt-2">
              Apenas Super Administradores podem acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Administradores</h1>
          <p className="text-gray-500">Crie e gerencie os administradores do sistema</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Link className="w-4 h-4 mr-2" />
                Gerar Link de Convite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Link de Convite</DialogTitle>
                <DialogDescription>
                  Crie um link para que um novo administrador possa se cadastrar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email (opcional)</Label>
                  <Input
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Se informado, apenas este email poderá usar o link.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select value={invitePapel} onValueChange={setInvitePapel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="super_admin">Super Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expiração</Label>
                  <Select value={inviteDiasValidade} onValueChange={setInviteDiasValidade}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dia</SelectItem>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="0">Nunca expira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {generatedLink && (
                  <div className="space-y-2">
                    <Label>Link Gerado</Label>
                    <div className="flex gap-2">
                      <Input value={generatedLink} readOnly className="text-xs" />
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedLink)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createInviteMutation.mutate({ 
                    email: inviteEmail || undefined, 
                    papel: invitePapel,
                    diasValidade: parseInt(inviteDiasValidade)
                  })}
                  disabled={createInviteMutation.isPending}
                >
                  {createInviteMutation.isPending ? "Gerando..." : "Gerar Link"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Administrador</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo administrador.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Nome completo"
                    value={newAdmin.nome}
                    onChange={(e) => setNewAdmin({ ...newAdmin, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    placeholder="Senha segura"
                    value={newAdmin.senha}
                    onChange={(e) => setNewAdmin({ ...newAdmin, senha: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select value={newAdmin.papel} onValueChange={(v) => setNewAdmin({ ...newAdmin, papel: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="super_admin">Super Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createAdminMutation.mutate(newAdmin)}
                  disabled={createAdminMutation.isPending || !newAdmin.nome || !newAdmin.email || !newAdmin.senha}
                >
                  {createAdminMutation.isPending ? "Criando..." : "Criar Admin"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Administradores
          </CardTitle>
          <CardDescription>Lista de todos os administradores do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAdmins ? (
            <p className="text-center py-4 text-gray-500">Carregando...</p>
          ) : admins && admins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.nome}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={admin.papel === "super_admin" ? "default" : "secondary"}>
                        {admin.papel === "super_admin" ? "Super Admin" : "Admin"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.ativo ? "default" : "destructive"}>
                        {admin.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admin.ultimoLogin
                        ? new Date(admin.ultimoLogin).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell>
                      {admin.id !== user?.id && (
                        <Button
                          size="sm"
                          variant={admin.ativo ? "destructive" : "default"}
                          onClick={() => toggleAdminMutation.mutate({ id: admin.id, ativo: !admin.ativo })}
                          disabled={toggleAdminMutation.isPending}
                        >
                          {admin.ativo ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-gray-500">Nenhum administrador encontrado.</p>
          )}
        </CardContent>
      </Card>

      {/* Lista de Convites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Convites Pendentes
          </CardTitle>
          <CardDescription>Links de convite gerados para novos administradores</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInvites ? (
            <p className="text-center py-4 text-gray-500">Carregando...</p>
          ) : invites && invites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email || "Qualquer email"}</TableCell>
                    <TableCell>
                      <Badge variant={invite.papel === "super_admin" ? "default" : "secondary"}>
                        {invite.papel === "super_admin" ? "Super Admin" : "Admin"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={invite.usado ? "secondary" : invite.ativo ? "default" : "destructive"}>
                        {invite.usado ? "Usado" : invite.ativo ? "Pendente" : "Bloqueado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invite.expiraEm 
                        ? new Date(invite.expiraEm).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {!invite.usado && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(`${window.location.origin}/admin/cadastro?token=${invite.token}`)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={invite.ativo ? "destructive" : "default"}
                            onClick={() => toggleInviteMutation.mutate({ id: invite.id, ativo: !invite.ativo })}
                            disabled={toggleInviteMutation.isPending}
                            title={invite.ativo ? "Bloquear Convite" : "Ativar Convite"}
                          >
                            {invite.ativo ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteInviteMutation.mutate(invite.id)}
                        disabled={deleteInviteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-gray-500">Nenhum convite pendente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
