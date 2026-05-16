import React, { useEffect } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, CreditCard, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MercadoPagoBrickProps {
  amount: number;
  description: string;
  payerEmail: string;
  tipo: string;
  alunoId: number;
  mesReferencia?: string;
  idItem?: string;
  isDemo?: boolean;
  onSuccess: (paymentId: string) => void;
  onError: (error: any) => void;
}

export function MercadoPagoBrick({
  amount,
  description,
  payerEmail,
  tipo,
  alunoId,
  mesReferencia,
  idItem,
  isDemo = false,
  onSuccess,
  onError
}: MercadoPagoBrickProps) {
  const { toast } = useToast();
  const [simulating, setSimulating] = React.useState(false);
  const [pixData, setPixData] = React.useState<{ qrCode: string, qrCodeBase64: string } | null>(null);

  useEffect(() => {
    const initMP = async () => {
      // Buscar chave pública do servidor (fallback) ou usar variável de ambiente
      let publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
      
      if (!publicKey) {
        try {
          const response = await fetch('/api/mercadopago/public-key');
          const data = await response.json();
          publicKey = data.publicKey;
        } catch (error) {
          console.error("Erro ao buscar chave pública do Mercado Pago:", error);
          return;
        }
      }
      
      if (!publicKey) {
        console.error("ERRO: Chave pública do Mercado Pago não configurada!");
        return;
      }
      
      try {
        initMercadoPago(publicKey, { locale: 'pt-BR' });
      } catch (error) {
        console.error("Erro ao inicializar SDK do Mercado Pago:", error);
      }
    };

    if (!isDemo) {
      initMP();
    }
  }, [isDemo]);

  const handleDemoPayment = () => {
    setSimulating(true);
    // Simular processamento no backend para dar a baixa real, mas como demo
    const demoPayload = {
      isDemo: true,
      transaction_amount: amount,
      description,
      tipo,
      alunoId,
      mesReferencia,
      idItem,
      payment_method_id: "pix",
      payer: { email: payerEmail }
    };

    setTimeout(() => {
      apiRequest("POST", "/api/mercadopago/process-payment", demoPayload)
        .then(async (response) => {
          const result = await response.json();
          setSimulating(false);
          toast({
            title: "Simulação Concluída",
            description: "Pagamento simulado com sucesso! A baixa foi dada no sistema.",
          });
          onSuccess("DEMO-" + Date.now());
        })
        .catch(err => {
          setSimulating(false);
          onError(err);
        });
    }, 1500);
  };

  const initialization = {
    amount: amount,
    payer: {
      email: payerEmail,
    },
  };

  const customization = {
    paymentMethods: {
      creditCard: "all" as any,
      debitCard: "all" as any,
      ticket: "all" as any,
      bankTransfer: "all" as any,
    },
  };

  const onSubmit = async (
    { selectedPaymentMethod, formData }: any,
  ) => {
    return new Promise((resolve, reject) => {
      // Adicionamos os dados do nosso contexto (aluno, tipo, etc)
      const payload = {
        ...formData,
        description,
        tipo,
        alunoId,
        mesReferencia,
        idItem
      };

      apiRequest("POST", "/api/mercadopago/process-payment", payload)
        .then(async (response) => {
          const result = await response.json();
          
          // Verificar se é um pagamento Pix pendente com dados de QR Code
          if (result.status === "pending" && result.point_of_interaction?.transaction_data) {
            const data = result.point_of_interaction.transaction_data;
            setPixData({
              qrCode: data.qr_code,
              qrCodeBase64: data.qr_code_base64
            });
            toast({
              title: "Pix Gerado!",
              description: "Use o QR Code abaixo para pagar.",
            });
            resolve(result);
            return;
          }

          if (result.status === "approved" || result.status === "in_process" || result.status === "pending") {
            toast({
              title: "Pagamento processado",
              description: `O status do seu pagamento é: ${result.status}`,
            });
            onSuccess(result.id);
            resolve(result);
          } else {
            toast({
              variant: "destructive",
              title: "Pagamento não aprovado",
              description: `Status: ${result.status_detail || result.status}`,
            });
            reject();
          }
        })
        .catch(async (error) => {
          console.error("Erro ao processar pagamento", error);
          
          let errorMessage = "Ocorreu um erro ao processar o pagamento. Tente novamente.";
          try {
            const errorData = await error.json();
            if (errorData.error) {
              errorMessage = `Erro: ${errorData.error}`;
            }
          } catch (e) {
            // Se não for JSON, mantém a mensagem padrão
          }

          toast({
            variant: "destructive",
            title: "Erro no processamento",
            description: errorMessage,
          });
          onError(error);
          reject();
        });
    });
  };

  const onErrorHandler = (error: any) => {
    console.error("Erro no Brick do Mercado Pago:", error);
    onError(error);
  };

  const onReady = () => {
    console.log("Mercado Pago Brick carregado");
  };

  if (isDemo) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-3 mb-4">
          <Badge className="bg-amber-500">MODO DEMO</Badge>
          <p className="text-xs text-amber-800 font-medium">Você está visualizando a simulação do checkout para demonstração.</p>
        </div>

        <Tabs defaultValue="pix" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pix" className="gap-2">
              <QrCode className="h-4 w-4" /> PIX
            </TabsTrigger>
            <TabsTrigger value="card" className="gap-2">
              <CreditCard className="h-4 w-4" /> Cartão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pix" className="space-y-4 text-center py-4 border rounded-xl bg-slate-50">
            <div className="bg-white p-4 inline-block rounded-lg shadow-sm mb-2">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DEMO-${alunoId}`} 
                alt="QR Code Demo" 
                className="w-32 h-32 opacity-50 grayscale"
              />
            </div>
            <p className="text-sm text-slate-500 px-6">
              No sistema real, o QR Code é gerado na hora e a baixa é instantânea.
            </p>
            <Button 
              onClick={handleDemoPayment} 
              disabled={simulating}
              className="w-[80%] bg-green-600 hover:bg-green-700"
            >
              {simulating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {simulating ? "Processando..." : "Simular Pagamento PIX"}
            </Button>
          </TabsContent>

          <TabsContent value="card" className="space-y-4 py-4 border rounded-xl bg-slate-50 px-4">
            <div className="space-y-3 opacity-60">
              <div className="h-10 bg-white border rounded px-3 flex items-center text-slate-400 text-sm">**** **** **** 4444</div>
              <div className="flex gap-2">
                <div className="h-10 bg-white border rounded px-3 flex items-center text-slate-400 text-sm w-1/2">12/30</div>
                <div className="h-10 bg-white border rounded px-3 flex items-center text-slate-400 text-sm w-1/2">***</div>
              </div>
            </div>
            <Button 
              onClick={handleDemoPayment} 
              disabled={simulating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {simulating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirmar Cartão (Demo)"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-[#009ee3] p-6 text-white text-center">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-90" />
        <h3 className="font-bold text-xl mb-1">Pagamento Seguro</h3>
        <p className="text-sm opacity-80">Você será redirecionado para o Mercado Pago</p>
      </div>
      
      <CardContent className="p-8 space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm text-slate-500">Valor a pagar</p>
          <p className="text-4xl font-black text-slate-900">
            R$ {amount.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-slate-400 italic mt-2">{description}</p>
        </div>

        <div className="pt-4 space-y-4">
          <Button 
            className="w-full h-14 text-lg font-bold bg-[#009ee3] hover:bg-[#007eb5] text-white shadow-md hover:shadow-xl transition-all gap-3"
            onClick={async () => {
              try {
                setSimulating(true);
                const response = await fetch('/api/mercadopago/create-preference', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tipo,
                    alunoId,
                    valor: amount,
                    descricao: description,
                    mesReferencia: mesReferencia || undefined,
                    idItem: idItem || undefined
                  })
                });
                
                const data = await response.json();
                if (data.init_point) {
                  window.location.href = data.init_point;
                } else {
                  console.error("Erro retornado pelo backend:", data);
                  toast({
                    title: "Falha no Pagamento",
                    description: data.error || "Não foi possível gerar o link de pagamento. Tente novamente em instantes.",
                    variant: "destructive"
                  });
                }
              } catch (error) {
                console.error("Erro ao redirecionar para Checkout Pro:", error);
                toast({
                  title: "Erro de Conexão",
                  description: "Verifique sua internet e tente novamente.",
                  variant: "destructive"
                });
              } finally {
                setSimulating(false);
              }
            }}
            disabled={simulating}
          >
            {simulating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                Pagar com Mercado Pago
                <ShieldCheck className="w-5 h-5" />
              </>
            )}
          </Button>
          
          <div className="flex items-center justify-center gap-4 pt-2">
            <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-6 grayscale opacity-50" alt="Visa" />
            <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-6 grayscale opacity-50" alt="Mastercard" />
            <img src="https://logopng.com.br/logos/pix-106.png" className="h-4 grayscale opacity-50" alt="Pix" />
            <img src="https://img.icons8.com/color/48/000000/barcode.png" className="h-6 grayscale opacity-50" alt="Boleto" />
          </div>
          
          <p className="text-[10px] text-slate-400">
            Ambiente 100% seguro e criptografado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
