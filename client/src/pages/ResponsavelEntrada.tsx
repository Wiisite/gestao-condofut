import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, LogIn, Shield, Bell, CreditCard, Calendar } from "lucide-react";
import { InterLogo } from "@/components/InterLogo";

export default function ResponsavelEntrada() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center p-1">
                <InterLogo size={32} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal dos Responsáveis</h1>
                <p className="text-sm text-gray-600">Escola de Futebol</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                Site Principal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Acompanhe o desenvolvimento do seu filho
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Acesse informações sobre pagamentos, eventos, uniformes e muito mais através do nosso portal exclusivo para responsáveis.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Visualize o status dos pagamentos e histórico de mensalidades
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Bell className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Receba lembretes de vencimentos e comunicados importantes
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Inscreva-se em jogos, campeonatos e atividades especiais
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Uniformes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Compre uniformes e equipamentos diretamente pelo portal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Login Card */}
          <Card className="h-full">
            <CardHeader className="text-center">
              <LogIn className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Já tem uma conta?</CardTitle>
              <CardDescription className="text-base">
                Faça login para acessar o portal e acompanhar seus filhos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/responsavel/login">
                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                  <LogIn className="w-5 h-5 mr-2" />
                  Fazer Login
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                Use seu email e senha cadastrados
              </p>
            </CardContent>
          </Card>

          {/* Register Card */}
          <Card className="h-full">
            <CardHeader className="text-center">
              <UserPlus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Primeira vez aqui?</CardTitle>
              <CardDescription className="text-base">
                Crie sua conta para começar a acompanhar seus filhos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/responsavel/cadastro">
                <Button size="lg" variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Criar Conta
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                Cadastro rápido e gratuito
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <div className="text-center mt-12 p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Precisa de ajuda?
          </h3>
          <p className="text-gray-600 mb-4">
            Entre em contato conosco se tiver dúvidas sobre o cadastro ou acesso ao portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="text-sm">
              <strong>Telefone:</strong> (11) 9999-9999
            </div>
            <div className="text-sm">
              <strong>Email:</strong> contato@escolafutebol.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}