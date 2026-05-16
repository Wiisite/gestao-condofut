import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, SquareUser, UsersIcon, Wallet, Bell, Building2, BarChart3, Settings, Camera, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Info, X, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InterLogo } from "@/components/InterLogo";
import { Link } from "wouter";

interface DashboardMetrics {
  totalAlunos: number;
  totalProfessores: number;
  totalTurmas: number;
  receitaMensal: number;
  receitaTotal: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "warning", title: "Pagamento Atrasado", message: "3 alunos com mensalidade em atraso", time: "Há 2 horas", read: false },
    { id: 2, type: "info", title: "Nova Matrícula", message: "João Silva foi matriculado na turma Sub-15", time: "Há 5 horas", read: false },
    { id: 3, type: "success", title: "Pagamento Recebido", message: "Pagamento de R$ 150,00 confirmado", time: "Ontem", read: true },
  ]);

  const [showPassword, setShowPassword] = useState(false);
  const [adminData, setAdminData] = useState({
    name: "Marcello",
    role: "Administrador",
    photo: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: alunos } = useQuery<any[]>({
    queryKey: ["/api/alunos"],
  });

  const { data: filiais } = useQuery<any[]>({
    queryKey: ["/api/filiais"],
  });



  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAdminData(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = () => {
    if (adminData.newPassword !== adminData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Senha Atualizada",
      description: "Sua senha foi alterada com sucesso.",
    });
    setIsProfileDialogOpen(false);
    setAdminData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Dashboard</h2>
          <p className="text-neutral-600">Visão geral da escola de futebol</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800">Dashboard</h2>
          <p className="text-neutral-600">Visão geral da escola de futebol</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold">Notificações</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                >
                  Marcar todas como lidas
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                        onClick={() => setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-1 rounded-full ${
                            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            notification.type === 'success' ? 'bg-green-100 text-green-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {notification.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                             notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                             <Info className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{notification.title}</p>
                              {!notification.read && <Badge variant="secondary" className="text-xs">Nova</Badge>}
                            </div>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifications(prev => prev.filter(n => n.id !== notification.id));
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Perfil do Administrador */}
          <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 px-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={adminData.photo} />
                  <AvatarFallback className="bg-primary text-white text-sm">M</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{adminData.name}</p>
                  <p className="text-xs text-gray-500">{adminData.role}</p>
                </div>
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Perfil do Administrador</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Foto do Perfil */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={adminData.photo} />
                    <AvatarFallback className="bg-primary text-white text-2xl">M</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Camera className="w-4 h-4 mr-2" />
                          Alterar Foto
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Informações */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="admin-name">Nome</Label>
                    <Input
                      id="admin-name"
                      value={adminData.name}
                      onChange={(e) => setAdminData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-role">Cargo</Label>
                    <Input id="admin-role" value={adminData.role} disabled />
                  </div>
                </div>

                {/* Alteração de Senha */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium text-sm">Alterar Senha</h4>
                  <div>
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                        value={adminData.currentPassword}
                        onChange={(e) => setAdminData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={adminData.newPassword}
                      onChange={(e) => setAdminData(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={adminData.confirmPassword}
                      onChange={(e) => setAdminData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handlePasswordChange} className="w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Atualizar Senha
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-neutral-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total de Alunos</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {metrics?.totalAlunos || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm">
                <span className="text-secondary font-medium">+8%</span>
                <span className="text-neutral-400 ml-1">vs mês anterior</span>
              </div>
              <Link href="/alunos">
                <Button variant="outline" size="sm" className="text-xs">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Ver Todos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Professores Ativos</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {metrics?.totalProfessores || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <SquareUser className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-secondary font-medium">+2</span>
              <span className="text-neutral-400 ml-1">novos professores</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Receita Total</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {formatCurrency(metrics?.receitaTotal || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Este mês: {formatCurrency(metrics?.receitaMensal || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-secondary font-medium">+12%</span>
              <span className="text-neutral-400 ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Turmas Ativas</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {metrics?.totalTurmas || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-neutral-400">
                {metrics?.totalProfessores ? Math.round((metrics.totalTurmas || 0) / metrics.totalProfessores) : 0} turmas
              </span>
              <span className="text-neutral-400 ml-1">por professor</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard das Unidades - Acesso Rápido */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center p-1">
                <InterLogo size={32} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-blue-800">Dashboard das Unidades</CardTitle>
                <p className="text-sm text-blue-600">Análise comparativa entre todas as unidades</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/dashboard-unidades'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">1</p>
              <p className="text-sm text-blue-700">Unidades Ativas</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{metrics?.totalAlunos || 0}</p>
              <p className="text-sm text-blue-700">Total de Alunos</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics?.receitaTotal || 0)}</p>
              <p className="text-sm text-blue-700">Receita Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card className="border-neutral-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Receita Mensal</CardTitle>
                <select className="text-sm border border-neutral-200 rounded-lg px-3 py-2">
                  <option>Últimos 6 meses</option>
                  <option>Último ano</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary/20 rounded-t" style={{ height: "60px" }}></div>
                  <span className="text-xs text-neutral-400">Jan</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary/40 rounded-t" style={{ height: "80px" }}></div>
                  <span className="text-xs text-neutral-400">Fev</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary/60 rounded-t" style={{ height: "120px" }}></div>
                  <span className="text-xs text-neutral-400">Mar</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary/80 rounded-t" style={{ height: "100px" }}></div>
                  <span className="text-xs text-neutral-400">Abr</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary rounded-t" style={{ height: "140px" }}></div>
                  <span className="text-xs text-neutral-400">Mai</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary rounded-t" style={{ height: "160px" }}></div>
                  <span className="text-xs text-neutral-400">Jun</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Distribution by Unit */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição de Alunos por Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filiais?.map((filial: any) => {
                const alunosCount = alunos?.filter((aluno: any) => aluno.filialId === filial.id).length || 0;
                const maxAlunos = Math.max(...(filiais?.map((f: any) => 
                  alunos?.filter((a: any) => a.filialId === f.id).length || 0
                ) || [1]));
                const percentage = maxAlunos > 0 ? (alunosCount / maxAlunos) * 100 : 0;
                
                return (
                  <div key={filial.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{filial.nome}</span>
                      <span className="text-sm font-bold text-primary">{alunosCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {(!filiais || filiais.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma unidade cadastrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
