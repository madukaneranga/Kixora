export interface PaymentProvider {
  name: string;
  createPaymentIntent: (order: CreatePaymentIntentParams) => Promise<PaymentIntentResult>;
  verifyPayment: (params: VerifyPaymentParams) => Promise<PaymentVerificationResult>;
}

export interface CreatePaymentIntentParams {
  orderId: string;
  amount: number;
  currency: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: Array<{
    itemNumber: string;
    itemName: string;
    amount: number;
    quantity: number;
  }>;
}

export interface PaymentIntentResult {
  success: boolean;
  paymentId: string;
  checkoutUrl?: string;
  error?: string;
}

export interface VerifyPaymentParams {
  paymentId: string;
  merchantId: string;
  orderId: string;
  payHereAmount: string;
  payHereSecret: string;
  statusCode: number;
  md5sig: string;
  method: string;
  statusMessage: string;
  cardHolderName?: string;
  cardNo?: string;
}

export interface PaymentVerificationResult {
  isValid: boolean;
  orderId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  error?: string;
}