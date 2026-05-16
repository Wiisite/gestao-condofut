import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LogIn, UserCircle, Building2 } from "lucide-react";

export default function PortalEscola() {
  const { data: config } = useQuery<{ logoUrl: string | null; nomeEscola: string; corPrimaria: string }>({
    queryKey: ["/api/configuracoes"],
  });

  const corPrimaria = config?.corPrimaria || "#3b82f6";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-48 z-0" style={{ backgroundColor: corPrimaria, opacity: 0.1 }}></div>
      <div className="absolute bottom-0 right-0 w-full h-48 z-0" style={{ backgroundColor: corPrimaria, opacity: 0.05 }}></div>

      <Card className="w-full max-w-md shadow-2xl border-none relative z-10 overflow-hidden">
        {/* Top Accent Line */}
        <div className="h-2 w-full" style={{ backgroundColor: corPrimaria }}></div>
        
        <CardContent className="pt-12 pb-10 px-8 flex flex-col items-center text-center">
          {/* Logo Container */}
          <div className="mb-8 w-40 h-40 rounded-full bg-white shadow-xl flex items-center justify-center overflow-hidden border-4" style={{ borderColor: corPrimaria }}>
            {config?.logoUrl ? (
              <img src={config.logoUrl} alt={config.nomeEscola} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="text-5xl font-black" style={{ color: corPrimaria }}>
                {config?.nomeEscola?.charAt(0) || "E"}
              </div>
            )}
          </div>

          <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
            {config?.nomeEscola || "Escola de Futebol"}
          </h1>
          <p className="text-slate-500 mb-10 font-medium italic">Portal Oficial de Gestão</p>

          <div className="w-full space-y-4">
            <Link href="/responsavel">
              <Button 
                className="w-full h-16 text-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-200"
                style={{ backgroundColor: corPrimaria }}
              >
                <UserCircle className="w-7 h-7" />
                PORTAL DO RESPONSÁVEL
              </Button>
            </Link>

            <Link href="/portal-unidade">
              <Button 
                variant="outline" 
                className="w-full h-16 text-xl font-bold flex items-center justify-center gap-3 border-2 transition-all hover:scale-[1.02] active:scale-95"
                style={{ borderColor: corPrimaria, color: corPrimaria }}
              >
                <Building2 className="w-7 h-7" />
                ACESSO POR UNIDADE
              </Button>
            </Link>

            <div className="pt-6">
              <Link href="/admin-login">
                <Button 
                  variant="ghost" 
                  className="w-full h-12 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-2 font-semibold"
                >
                  <LogIn className="w-5 h-5" />
                  Acesso Administrativo
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <footer className="mt-12 text-slate-400 text-sm flex flex-col items-center gap-2">
        <p>© {new Date().getFullYear()} {config?.nomeEscola || "CondoFut"} | CNPJ: 31.866.047/0001-66</p>
        <p className="opacity-75">
          Projetado e desenvolvido por <a href="https://wiisite.com.br" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-500 hover:text-slate-700">Wiisite</a>
        </p>
      </footer>
    </div>
  );
}
