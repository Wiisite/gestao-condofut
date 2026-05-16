import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CheckoutSimulado() {
  const [, params] = useRoute("/pagamento/simulado/:id");
  const id = params?.id;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-8 shadow-2xl border-none">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-slate-900 mb-2">Pagamento Simulado</CardTitle>
        <CardDescription className="text-lg mb-4">
          Esta é uma página de teste para o link direto.
        </CardDescription>
        <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800 mb-8">
          <p className="font-bold">ID da Transação:</p>
          <p className="font-mono break-all">{id}</p>
          <p className="mt-2 text-xs">
            Isso aparece quando o servidor está em modo de simulação (sem Access Token real).
          </p>
        </div>
        <div className="space-y-4">
          <Link href="/portal">
            <Button className="w-full h-12 text-lg font-semibold bg-slate-900 hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o Portal
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
