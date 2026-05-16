import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Credenciais do Mercado Pago - Usar variáveis de ambiente
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("ERRO: MERCADOPAGO_ACCESS_TOKEN não configurado!");
}

const client = new MercadoPagoConfig({ 
  accessToken: ACCESS_TOKEN,
  options: { timeout: 10000 }
});

console.log("Mercado Pago SDK Initialized with Production Token.");

const preference = new Preference(client);
const payment = new Payment(client);

export interface CreatePaymentData {
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  payer_email: string;
  external_reference: string;
}

export async function createPreference(data: CreatePaymentData) {
  try {
    const response = await preference.create({
      body: {
        items: [
          {
            id: data.external_reference,
            title: data.title,
            description: data.description,
            quantity: data.quantity,
            unit_price: data.unit_price,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: data.payer_email
        },
        external_reference: data.external_reference,
        back_urls: {
          success: `${process.env.APP_URL || 'http://localhost:5000'}/pagamento/sucesso`,
          failure: `${process.env.APP_URL || 'http://localhost:5000'}/pagamento/erro`,
          pending: `${process.env.APP_URL || 'http://localhost:5000'}/pagamento/pendente`
        },
        auto_return: 'approved',
        notification_url: `${process.env.APP_URL || 'http://localhost:5000'}/api/mercadopago/webhook`
      }
    });

    return {
      id: response.id,
      init_point: response.init_point, // URL para checkout
      sandbox_init_point: response.sandbox_init_point // URL para teste
    };
  } catch (error: any) {
    console.error('Erro ao criar preferência no Mercado Pago:', error);
    if (error.cause) {
      console.error('Causa detalhada:', JSON.stringify(error.cause, null, 2));
    }
    throw error;
  }
}

export async function getPaymentStatus(paymentId: string) {
  try {
    const response = await payment.get({ id: paymentId });
    return {
      id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      external_reference: response.external_reference,
      transaction_amount: response.transaction_amount
    };
  } catch (error) {
    console.error('Erro ao buscar status do pagamento:', error);
    throw error;
  }
}

// Função para simular pagamento (modo teste)
export function createSimulatedPayment(data: CreatePaymentData) {
  // Gera um ID de preferência simulado
  const preferenceId = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: preferenceId,
    init_point: `/pagamento/simulado/${preferenceId}`,
    sandbox_init_point: `/pagamento/simulado/${preferenceId}`,
    simulated: true,
    data: data
  };
}

export interface ProcessPaymentData {
  transaction_amount: number;
  token?: string;
  description: string;
  installments: number;
  payment_method_id: string;
  issuer_id?: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  external_reference?: string;
}

export async function processPayment(data: ProcessPaymentData) {
  try {
    const response = await payment.create({
      body: {
        transaction_amount: Number(data.transaction_amount),
        token: data.token,
        description: data.description,
        installments: Number(data.installments),
        payment_method_id: data.payment_method_id,
        issuer_id: data.issuer_id ? data.issuer_id.toString() : undefined,
        payer: data.payer,
        external_reference: data.external_reference,
        notification_url: `${process.env.APP_URL || 'http://localhost:5000'}/api/mercadopago/webhook`
      }
    });

    return {
      id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      payment_method_id: response.payment_method_id,
      external_reference: response.external_reference,
      point_of_interaction: response.point_of_interaction,
    };
  } catch (error) {
    console.error('Erro ao processar pagamento transparente:', error);
    throw error;
  }
}
