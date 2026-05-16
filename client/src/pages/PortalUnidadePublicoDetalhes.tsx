import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Calendar, 
  ArrowLeft,
  User,
  BookOpen,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  Plus
} from "lucide-react";
import type { Filial, Professor, TurmaWithProfessor } from "@shared/schema";

interface Config {
  logoUrl: string | null;
  nomeEscola: string;
  corPrimaria: string;
  corSecundaria: string;
}

export default function PortalUnidadePublicoDetalhes() {
  const [, params] = useRoute("/portal-unidade/:id");
  const [, setLocation] = useLocation();
  const filialId = parseInt(params?.id || "0");

  const { data: filial, isLoading: loadingFilial } = useQuery<Filial>({
    queryKey: [`/api/filiais/${filialId}`],
  });

  const { data: professores = [], isLoading: loadingProfessores } = useQuery<Professor[]>({
    queryKey: [`/api/filiais/public/${filialId}/professores`],
    enabled: !!filialId,
  });

  const { data: turmas = [], isLoading: loadingTurmas } = useQuery<TurmaWithProfessor[]>({
    queryKey: [`/api/filiais/public/${filialId}/turmas`],
    enabled: !!filialId,
  });

  const { data: config } = useQuery<Config>({
    queryKey: ["/api/admin/configuracoes"],
  });

  const corPrimaria = config?.corPrimaria || "#2563eb";

  if (loadingFilial || loadingProfessores || loadingTurmas) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!filial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 p-4">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Unidade não encontrada</h2>
        <Button onClick={() => setLocation("/portal-unidade")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Unidades
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-12 font-sans">
      {/* Header Premium Flutuante */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/portal-unidade")}
              className="rounded-full hover:bg-neutral-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              {config?.logoUrl && (
                <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
              )}
              <h2 className="text-xl font-bold text-neutral-900 hidden md:block">
                {config?.nomeEscola || "Condofut Academy"}
              </h2>
            </div>
          </div>
          <Button 
            className="rounded-full font-bold px-6"
            style={{ backgroundColor: corPrimaria }}
            onClick={() => setLocation("/responsavel/cadastro")}
          >
            Matricule-se
          </Button>
        </div>
      </header>

      {/* Hero Section Impactante */}
      <div className="relative overflow-hidden bg-neutral-900 py-24 md:py-32">
        {/* Background Photo/Patterns */}
        <div className="absolute inset-0">
          {filial.fotoFundoUrl ? (
            <>
              <img 
                src={filial.fotoFundoUrl} 
                alt="Fundo" 
                className="w-full h-full object-cover opacity-40 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
            </>
          ) : (
            <>
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent blur-3xl scale-150 opacity-20" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
            </>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge 
              className="mb-4 px-4 py-1.5 text-sm font-bold uppercase tracking-widest bg-white/10 text-white border-white/20 backdrop-blur-sm"
            >
              Unidade Oficial
            </Badge>
            <h1 className="text-4xl md:text-7xl font-black text-white leading-tight mb-6">
              BEM-VINDO À <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                {filial.nome.toUpperCase()}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-xl leading-relaxed mb-8">
              Treine na unidade mais moderna da região. Infraestrutura completa e os melhores profissionais à sua disposição.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white font-medium">{filial.bairro || "Excelente Localização"}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white font-medium">{professores.length} Professores</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Informações */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white p-2">
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6">Contatos e Localização</h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">Endereço</p>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                          {filial.endereco}<br />
                          {filial.bairro}, {filial.cidade} - {filial.estado}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">Telefone</p>
                        <p className="text-sm text-neutral-500">{filial.telefone}</p>
                      </div>
                    </div>

                    {filial.email && (
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                          <Mail className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900">E-mail</p>
                          <p className="text-sm text-neutral-500">{filial.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-neutral-100" />

                <div>
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6">Horário de Funcionamento</h3>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">Horários</p>
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        {filial.horarioFuncionamento || "Consulte horários disponíveis"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" size="icon" className="rounded-xl border-neutral-200 hover:bg-neutral-50">
                    <Instagram className="w-5 h-5 text-neutral-600" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-xl border-neutral-200 hover:bg-neutral-50">
                    <Facebook className="w-5 h-5 text-neutral-600" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-xl border-neutral-200 hover:bg-neutral-50">
                    <Globe className="w-5 h-5 text-neutral-600" />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white p-6">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6">Equipe Técnica</h3>
              <div className="space-y-4">
                {professores.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4 italic">Nenhum professor no momento.</p>
                ) : (
                  professores.map((professor) => (
                    <div key={professor.id} className="flex items-center gap-4 p-3 hover:bg-neutral-50 rounded-2xl transition-colors cursor-default group">
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">{professor.nome}</p>
                        <p className="text-xs text-neutral-500">{professor.especialidade || "Especialista"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </aside>

          {/* Turmas e Conteúdo Principal */}
          <main className="lg:col-span-2 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-xl border border-neutral-100">
              <div>
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">TURMAS DISPONÍVEIS</h2>
                <p className="text-neutral-500">Escolha a melhor categoria para o seu filho</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-0 px-4 py-2 rounded-xl font-bold">
                  {turmas.length} Turmas
                </Badge>
              </div>
            </div>
            
            {turmas.length === 0 ? (
              <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden bg-white p-20 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-300">
                  <BookOpen className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">Aguardando Novas Turmas</h3>
                <p className="text-neutral-500 max-w-md mx-auto">
                  Estamos organizando os novos horários. Entre em contato conosco para ser avisado sobre novas vagas.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {turmas.map((turma) => (
                  <Card key={turma.id} className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                    <div 
                      className="h-3 transition-all duration-500 group-hover:h-4"
                      style={{ backgroundColor: corPrimaria }}
                    />
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <Badge className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-0 px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                          {turma.categoria}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                          <Users className="w-4 h-4" />
                          <span>{turma.capacidadeMaxima} Vagas</span>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-black text-neutral-900 mb-6 group-hover:text-blue-600 transition-colors leading-tight">
                        {turma.nome}
                      </h3>

                      <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-neutral-600">
                          <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="font-bold text-sm tracking-tight">{turma.horario}</span>
                        </div>
                        <div className="flex items-center gap-3 text-neutral-600">
                          <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium">{turma.diasSemana}</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-6 border-t border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest leading-none mb-1">Professor</p>
                            <p className="text-xs font-bold text-neutral-700">{turma.professor?.nome || "A definir"}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full bg-neutral-50 hover:bg-blue-600 hover:text-white transition-all"
                          onClick={() => setLocation("/responsavel/cadastro")}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Banner CTA Final */}
            <div className="p-12 bg-neutral-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="flex-1">
                  <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                    COMECE HOJE A <br />
                    <span className="text-blue-400">EVOLUÇÃO DO SEU FILHO</span>
                  </h3>
                  <p className="text-neutral-400 mb-8 max-w-md">
                    Matricule-se na {filial.nome} e faça parte da maior escola de futebol com foco em formação integral.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      className="bg-white text-neutral-900 hover:bg-blue-400 hover:text-white font-black h-14 px-10 rounded-2xl transition-all shadow-xl shadow-white/5"
                      onClick={() => setLocation("/responsavel/cadastro")}
                    >
                      MATRICULAR AGORA
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-white/10 hover:bg-white/5 text-white font-bold h-14 px-8 rounded-2xl transition-all"
                      onClick={() => window.open(`https://wa.me/${filial.telefone?.replace(/\D/g, '')}`, '_blank')}
                    >
                      FALAR COM CONSULTOR
                    </Button>
                  </div>
                </div>
                <div className="w-48 h-48 bg-white/5 rounded-full flex items-center justify-center p-8 backdrop-blur-sm border border-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  {config?.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain opacity-50" />
                  ) : (
                    <Building2 className="w-full h-full text-white/20" />
                  )}
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]" />
              <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]" />
            </div>
          </main>
        </div>
      </div>

      {/* Footer Minimalista */}
      <footer className="max-w-7xl mx-auto px-4 pt-10 border-t border-neutral-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-60">
          <div className="flex items-center gap-3">
            {config?.logoUrl && (
              <img src={config.logoUrl} alt="Logo" className="w-6 h-6 object-contain grayscale" />
            )}
            <p className="text-xs font-bold tracking-widest uppercase">
              {config?.nomeEscola || "Condofut Academy"}
            </p>
          </div>
          <p className="text-[10px] font-medium">© 2026 - TODOS OS DIREITOS RESERVADOS</p>
        </div>
      </footer>
    </div>
  );
}
