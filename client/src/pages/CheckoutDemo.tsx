import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, QrCode, FileText, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { MercadoPagoBrick } from "@/components/pagamento/MercadoPagoBrick";

export default function CheckoutDemo() {
  const [step, setStep] = useState<"payment" | "success">("payment");
  const [loading, setLoading] = useState(false);

  const handleSimulatePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 2000);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8 shadow-2xl border-none">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900 mb-2">Pagamento Aprovado!</CardTitle>
          <CardDescription className="text-lg mb-8">
            Esta é uma demonstração de como seu aluno verá a confirmação após o pagamento.
          </CardDescription>
          <div className="space-y-4">
            <Button onClick={() => setStep("payment")} className="w-full h-12 text-lg font-semibold">
              Voltar para o Início
            </Button>
            <Link href="/landingpage">
              <Button variant="outline" className="w-full h-12 text-lg font-semibold">
                Voltar para o Site
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/landingpage">
            <Button variant="ghost" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-medium">Ambiente de Demonstração Seguro</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resumo do Pedido */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="shadow-lg border-none sticky top-24">
              <CardHeader className="bg-slate-900 text-white rounded-t-xl">
                <CardTitle className="text-xl">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800">Mensalidade - Sub-15</p>
                    <p className="text-xs text-slate-500">Referência: Junho/2024</p>
                  </div>
                  <span className="font-bold">R$ 150,00</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-600">Taxa de Matrícula</span>
                  <span className="text-slate-400">Isento</span>
                </div>
                <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                  <span className="text-xl font-black uppercase text-slate-900">Total</span>
                  <span className="text-2xl font-black text-slate-900">R$ 150,00</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg flex gap-2 items-start mt-4">
                  <Badge variant="secondary" className="bg-blue-600 text-white shrink-0">SaaS</Badge>
                  <p className="text-xs text-blue-800">Esta tela é customizável com as cores e logo da sua escola de futebol.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formas de Pagamento */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="shadow-2xl border-none overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-slate-900">Como deseja pagar?</CardTitle>
                <CardDescription>Escolha uma das opções abaixo para testar o fluxo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex gap-3 items-center">
                    <Badge className="bg-amber-500">REAL</Badge>
                    <p className="text-sm text-amber-800">
                      Você está visualizando o checkout real integrado. No ambiente oficial, os dados serão processados pela sua conta Mercado Pago.
                    </p>
                  </div>

                  <MercadoPagoBrick
                    amount={150.00}
                    description="Mensalidade - Sub-15 (Demonstração)"
                    payerEmail="cliente-teste@exemplo.com"
                    tipo="demo"
                    alunoId={0}
                    onSuccess={(paymentId) => {
                      console.log("Pagamento demo aprovado:", paymentId);
                      setStep("success");
                    }}
                    onError={(error) => {
                      console.error("Erro no checkout real:", error);
                    }}
                  />

                  <p className="text-center text-xs text-slate-400 mt-4">
                    Segurança garantida pelo Mercado Pago. Suas informações estão protegidas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
