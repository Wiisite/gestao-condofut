import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Volleyball, 
  BarChart3, 
  Users, 
  SquareUser, 
  UsersIcon, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut,
  Building2,
  ClipboardList,
  Menu,
  X,
  Activity,
  Package
} from "lucide-react";
import { InterLogo } from "@/components/InterLogo";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Sidebar() {
  const { user } = useAdminAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: config } = useQuery<{ logoUrl: string | null; nomeEscola: string }>({
    queryKey: ["/api/configuracoes"],
  });

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
      active: location === "/",
    },
    {
      name: "Alunos",
      href: "/alunos",
      icon: Users,
      active: location === "/alunos",
    },
    {
      name: "Professores",
      href: "/professores",
      icon: SquareUser,
      active: location === "/professores",
    },
    {
      name: "Turmas",
      href: "/turmas",
      icon: UsersIcon,
      active: location === "/turmas",
    },
    {
      name: "Gestão de Turmas",
      href: "/gestao-turmas",
      icon: Users,
      active: location === "/gestao-turmas",
    },
    {
      name: "Unidades",
      href: "/unidades",
      icon: Building2,
      active: location === "/unidades" || location === "/filiais",
    },
    {
      name: "Financeiro",
      href: "/financeiro",
      icon: DollarSign,
      active: location === "/financeiro",
    },
    {
      name: "Combos de Aulas",
      href: "/combos-aulas",
      icon: Package,
      active: location === "/combos-aulas",
    },
    {
      name: "Relatórios",
      href: "/relatorios",
      icon: FileText,
      active: location === "/relatorios",
    },
    {
      name: "Relatório de Presenças",
      href: "/relatorio-presencas",
      icon: ClipboardList,
      active: location === "/relatorio-presencas",
    },
    {
      name: "Avaliação Física",
      href: "/avaliacao-fisica",
      icon: Activity,
      active: location === "/avaliacao-fisica",
    },
    {
      name: "Configurações",
      href: "/configuracoes",
      icon: Settings,
      active: location === "/configuracoes",
    },
    {
      name: "Portal do Responsável",
      href: "/portal",
      icon: Users,
      active: location === "/portal",
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md"
      >
        {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-white shadow-lg border-r border-neutral-100 flex flex-col transition-transform duration-300 ease-in-out z-50",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0 fixed inset-y-0 left-0" : "-translate-x-full fixed inset-y-0 left-0 lg:relative lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-neutral-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 lg:w-[65px] lg:h-[65px] flex items-center justify-center overflow-hidden">
              {config?.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-blue-600 rounded-lg flex items-center justify-center">
                  <InterLogo size={28} />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-base lg:text-lg font-semibold text-neutral-800">
                {config?.nomeEscola || "EscolaFut"}
              </h1>
              <p className="text-xs lg:text-sm text-neutral-400">Sistema de Gestão</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start px-4 py-3 h-auto font-normal",
                        item.active
                          ? "text-primary bg-primary/10 hover:bg-primary/15"
                          : "text-neutral-600 hover:text-primary hover:bg-primary/5"
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">
                {user?.nome || "Administrador"}
              </p>
              <p className="text-xs text-neutral-400">{user?.papel || "Admin"}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
