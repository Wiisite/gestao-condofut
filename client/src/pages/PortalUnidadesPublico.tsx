import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  MapPin,
  Phone,
  Search,
  ArrowRight,
  LogIn,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";

interface Filial {
  id: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  horarioFuncionamento: string | null;
  ativa: boolean;
}

export default function PortalUnidadesPublico() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  const { data: unidades = [], isLoading } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const filteredUnidades = unidades.filter((unidade: Filial) =>
    unidade.ativa !== false && (
      unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade.endereco?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Premium */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/")}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                  Nossas Unidades
                </h1>
                <p className="text-neutral-500 text-sm md:text-base">
                  Encontre a unidade mais próxima de você
                </p>
              </div>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nome ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-neutral-50 border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {filteredUnidades.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300">
            <Building2 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900">Nenhuma unidade encontrada</h3>
            <p className="text-neutral-500">Tente ajustar sua busca para encontrar o que procura.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredUnidades.map((unidade) => (
              <Card key={unidade.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white">
                <div className="h-3 bg-blue-600" />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 px-3 py-1">
                      Aberta
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mt-4 font-bold text-neutral-900">
                    {unidade.nome}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-neutral-600">
                      <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{unidade.endereco || "Endereço não informado"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-600">
                      <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                      <span className="text-sm font-medium">{unidade.telefone || "Contato não informado"}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex flex-col gap-3">
                    <Button 
                      className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all group-hover:gap-3 gap-2"
                      onClick={() => setLocation(`/portal-unidade/${unidade.id}`)}
                    >
                      Ver Detalhes
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full h-12 rounded-xl text-neutral-500 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
                      onClick={() => setLocation("/portal-unidade/login")}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sou Gestor desta Unidade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer Simples */}
      <div className="py-12 text-center text-neutral-400 text-sm">
        <p>© 2026 Sistema de Gestão Esportiva. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
