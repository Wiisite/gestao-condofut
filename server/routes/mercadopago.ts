import { Router } from "express";
import { storage } from "../storage";
import { requireResponsavelAuth } from "../auth";
import { 
  createPreference, 
  createSimulatedPayment, 
  getPaymentStatus,
  processPayment,
  CreatePaymentData,
  ProcessPaymentData
} from "../mercadopago";

const router = Router();

// Rota para obter a chave pública (Fallback para quando o build não injeta o .env)
router.get("/public-key", async (req, res) => {
  const publicKey = process.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  if (!publicKey) {
    console.error("ERRO: VITE_MERCADOPAGO_PUBLIC_KEY não configurada no servidor!");
    return res.status(404).json({ message: "Chave pública não encontrada" });
  }
  res.json({ publicKey });
});

// Rota para processar Pagamento Transparente (Bricks)
router.post("/process-payment", requireResponsavelAuth, async (req, res) => {
  try {
    const { 
      transaction_amount, 
      token, 
      description, 
      installments, 
      payment_method_id, 
      issuer_id, 
      payer,
      tipo, 
      alunoId, 
      mesReferencia, 
      idItem
    } = req.body;

    // Validar dados básicos
    if (!transaction_amount || !payment_method_id) {
      return res.status(400).json({ message: "Dados de pagamento incompletos (amount ou method_id faltando)" });
    }

    // O token é obrigatório para tudo exceto PIX
    if (payment_method_id !== 'pix' && !token) {
      return res.status(400).json({ message: "Token de cartão é obrigatório para este método de pagamento" });
    }

    // Gerar external_reference para conciliação no webhook
    const refId = mesReferencia || idItem || '0';
    const externalReference = `${tipo}:${alunoId}:${refId}:${Date.now()}`;

    const paymentData: ProcessPaymentData = {
      transaction_amount,
      token,
      description: description || `Pagamento de ${tipo}`,
      installments,
      payment_method_id,
      issuer_id,
      payer,
      external_reference: externalReference
    };

    const paymentResponse = await processPayment(paymentData);
    res.json(paymentResponse);

  } catch (error: any) {
    console.error("ERRO CRÍTICO no process-payment:", error);
    console.log("Payload que causou o erro:", JSON.stringify(req.body, null, 2));
    
    // Tentar extrair mensagem detalhada do erro do Mercado Pago se existir
    const detail = error?.cause?.[0]?.description || error?.message || "Erro interno";
    
    res.status(500).json({ 
      message: "Erro ao processar pagamento no Mercado Pago", 
      error: detail,
      fullError: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});


// Mercado Pago Routes
router.post("/create-preference", requireResponsavelAuth, async (req, res) => {
  try {
    const { tipo, alunoId, valor, descricao, mesReferencia, idItem } = req.body;
    const responsavelId = req.session.responsavelId!;
    
    const responsavelData = await storage.getResponsavelWithAlunos(responsavelId);
    
    // external_reference format: tipo:alunoId:refId:timestamp
    const refId = mesReferencia || idItem || '0';
    const externalReference = `${tipo}:${alunoId}:${refId}:${Date.now()}`;
    
    const prefData: CreatePaymentData = {
      title: descricao,
      description: `Pagamento de ${tipo} - ${descricao}`,
      quantity: 1,
      unit_price: parseFloat(valor),
      payer_email: responsavelData?.email || "contato@escolafutebol.com",
      external_reference: externalReference
    };
    
    const pref = await createPreference(prefData);
    res.json(pref);
    
  } catch (error) {
    console.error("Error creating preference:", error);
    res.status(500).json({ message: "Erro ao criar preferência de pagamento" });
  }
});

router.post("/confirm-simulated", requireResponsavelAuth, async (req, res) => {
  try {
    const { preferenceId, alunoId, mesReferencia, valor, formaPagamento, tipo, idItem } = req.body;
    const responsavelId = req.session.responsavelId!;

    console.log("Confirmando pagamento simulado:", { tipo, alunoId, mesReferencia, idItem });
    
    if (tipo === 'evento') {
      await storage.createInscricaoEvento({
        eventoId: parseInt(idItem),
        alunoId: parseInt(alunoId),
        statusPagamento: "pago",
        mercadopagoId: preferenceId,
        mercadopagoStatus: "approved",
        observacoes: `Pago via Simulação MP - Ref: ${preferenceId}`
      });
    } else if (tipo === 'uniforme') {
      await storage.createCompraUniforme({
        uniformeId: parseInt(idItem),
        alunoId: parseInt(alunoId),
        tamanho: req.body.tamanho || 'G',
        cor: req.body.cor || 'Azul',
        quantidade: req.body.quantidade || 1,
        preco: valor.toString(),
        statusPagamento: "pago",
        mercadopagoId: preferenceId,
        mercadopagoStatus: "approved"
      });
    } else {
      // Mensalidade
      await storage.createPagamento({
        alunoId: parseInt(alunoId),
        valor: valor.toString(),
        mesReferencia: mesReferencia,
        dataPagamento: new Date().toISOString().split('T')[0],
        formaPagamento: formaPagamento || "Mercado Pago (Simulado)",
        status: "pago",
        mercadopagoId: preferenceId,
        mercadopagoStatus: "approved",
        observacoes: `Pagamento simulado via Portal - Ref: ${preferenceId}`
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error confirming simulated payment:", error);
    res.status(500).json({ message: "Erro ao confirmar pagamento simulado" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log("Webhook Mercado Pago recebido:", { type, data });
    
    if (type === "payment") {
      const paymentId = data.id;
      const mpPayment = await getPaymentStatus(paymentId);
      
      console.log(`[Webhook MP] Processando pagamento ${paymentId} - Status: ${mpPayment.status}`);
      
      const externalRef = mpPayment.external_reference;
      if (!externalRef) {
        console.warn("[Webhook MP] Pagamento sem external_reference:", paymentId);
        return res.status(200).send("OK");
      }

      const [tipo, alunoIdStr, refId, timestamp] = externalRef.split(":");
      const alunoId = parseInt(alunoIdStr);
      const valorPago = mpPayment.transaction_amount?.toString() || "0.00";

      if (mpPayment.status === "approved") {
        console.log(`[Webhook MP] Pagamento APROVADO: ${tipo} para aluno ${alunoId}`);

        if (tipo === "mensalidade") {
          const pagamentos = await storage.getPagamentos();
          const jaExiste = pagamentos.some(p => p.mercadopagoId === paymentId.toString());
          
          if (!jaExiste) {
            await storage.createPagamento({
              alunoId: alunoId,
              valor: valorPago,
              mesReferencia: refId,
              dataPagamento: new Date().toISOString().split('T')[0],
              formaPagamento: "Mercado Pago",
              status: "pago",
              mercadopagoId: paymentId.toString(),
              mercadopagoStatus: "approved",
              observacoes: `Pago via Mercado Pago - Transação: ${paymentId}`
            });
          }
        } else if (tipo === "evento") {
          const eventoId = parseInt(refId);
          const inscricoes = await storage.getInscricoesEventos();
          const inscricao = inscricoes.find(i => i.eventoId === eventoId && i.alunoId === alunoId);
          
          if (inscricao) {
            await storage.updateInscricaoEvento(inscricao.id, {
              statusPagamento: "pago",
              mercadopagoId: paymentId.toString(),
              mercadopagoStatus: "approved"
            });
          } else {
            await storage.createInscricaoEvento({
              eventoId,
              alunoId,
              statusPagamento: "pago",
              mercadopagoId: paymentId.toString(),
              mercadopagoStatus: "approved",
              observacoes: `Inscrição criada via Webhook MP - Transação: ${paymentId}`
            });
          }
        } else if (tipo === "uniforme") {
          const uniformeId = parseInt(refId);
          const compras = await storage.getComprasUniformes();
          const compraPendente = compras.find(c => 
            c.uniformeId === uniformeId && 
            c.alunoId === alunoId && 
            c.statusPagamento === "pendente"
          );
          
          if (compraPendente) {
            await storage.updateCompraUniforme(compraPendente.id, {
              statusPagamento: "pago",
              mercadopagoId: paymentId.toString(),
              mercadopagoStatus: "approved"
            });
          } else {
            await storage.createCompraUniforme({
              uniformeId,
              alunoId,
              tamanho: "G",
              cor: "Padrão",
              quantidade: 1,
              preco: valorPago,
              statusPagamento: "pago",
              mercadopagoId: paymentId.toString(),
              mercadopagoStatus: "approved"
            });
          }
        }
      } else if (mpPayment.status && ["rejected", "cancelled", "refunded"].includes(mpPayment.status)) {
        console.warn(`[Webhook MP] Pagamento ${mpPayment.status}: ${paymentId} para aluno ${alunoId}`);
        
        if (tipo === "mensalidade") {
          const pagamentos = await storage.getPagamentos();
          const p = pagamentos.find(p => p.mercadopagoId === paymentId.toString());
          if (p) {
            await storage.updatePagamento(p.id, { 
              status: mpPayment.status === "refunded" ? "estornado" : "cancelado",
              mercadopagoStatus: mpPayment.status
            });
          }
        }
      }
    }
    
    res.status(200).send("OK");

  } catch (error) {
    console.error("Erro no webhook do Mercado Pago:", error);
    res.status(500).send("Error");
  }
});

export default router;
