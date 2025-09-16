import { PaymentProvider, CreatePaymentIntentParams, PaymentIntentResult, VerifyPaymentParams, PaymentVerificationResult } from './types';
import { createHash } from 'crypto';

export class PayHereProvider implements PaymentProvider {
  name = 'PayHere';

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    try {
      const response = await fetch('/api/payments/payhere/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          paymentId: result.paymentId,
          checkoutUrl: result.checkoutUrl,
        };
      } else {
        return {
          success: false,
          paymentId: '',
          error: result.error || 'Failed to create payment',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        paymentId: '',
        error: error.message || 'Network error',
      };
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    try {
      // Verify the MD5 signature
      const hashString = [
        params.merchantId,
        params.orderId,
        params.payHereAmount,
        params.payHereSecret,
        params.statusCode
      ].join('').toUpperCase();

      const hash = createHash('md5').update(hashString).digest('hex').toUpperCase();

      if (hash !== params.md5sig) {
        return {
          isValid: false,
          orderId: params.orderId,
          amount: parseFloat(params.payHereAmount),
          status: 'failed',
          error: 'Invalid signature',
        };
      }

      // Status codes: 2 = success, -1 = failed, -2 = pending, others = failed
      let status: 'success' | 'failed' | 'pending';
      switch (params.statusCode) {
        case 2:
          status = 'success';
          break;
        case -2:
          status = 'pending';
          break;
        default:
          status = 'failed';
      }

      return {
        isValid: true,
        orderId: params.orderId,
        amount: parseFloat(params.payHereAmount),
        status,
        transactionId: params.paymentId,
      };
    } catch (error: any) {
      return {
        isValid: false,
        orderId: params.orderId,
        amount: parseFloat(params.payHereAmount || '0'),
        status: 'failed',
        error: error.message || 'Verification error',
      };
    }
  }
}

export const payHereProvider = new PayHereProvider();