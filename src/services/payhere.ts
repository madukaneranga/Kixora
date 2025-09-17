// PayHere Frontend Service - Professional integration with proper error handling

export interface PayHerePaymentData {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
  sandbox?: boolean;
}

export interface PayHerePaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export interface PayHereCallbacks {
  onCompleted: (orderId: string) => void;
  onDismissed: () => void;
  onError: (error: string) => void;
}

// Extend window interface for PayHere
declare global {
  interface Window {
    payhere?: {
      startPayment: (params: PayHerePaymentData) => void;
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (error: string) => void;
    };
  }
}

export class PayHereService {
  private static instance: PayHereService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): PayHereService {
    if (!PayHereService.instance) {
      PayHereService.instance = new PayHereService();
    }
    return PayHereService.instance;
  }

  /**
   * Initialize PayHere script if not already loaded
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('PayHere already initialized');
      return;
    }

    if (this.initializationPromise) {
      console.log('PayHere initialization in progress, waiting...');
      return this.initializationPromise;
    }

    console.log('Starting PayHere initialization...');
    this.initializationPromise = this.loadPayHereScript();
    await this.initializationPromise;
    this.isInitialized = true;
    console.log('PayHere initialization completed');
  }

  private loadPayHereScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if PayHere is already available
      if (window.payhere) {
        console.log('PayHere script already loaded');
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="payhere.js"]');
      if (existingScript) {
        console.log('PayHere script found in DOM, waiting for load');
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('PayHere script failed to load')));
        return;
      }

      console.log('Loading PayHere script dynamically');
      const script = document.createElement('script');
      script.src = 'https://www.payhere.lk/lib/payhere.js';
      script.type = 'text/javascript';

      script.onload = () => {
        console.log('PayHere script loaded successfully');
        resolve();
      };

      script.onerror = () => {
        console.error('Failed to load PayHere script');
        reject(new Error('PayHere script failed to load'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Start PayHere payment with proper error handling and callbacks
   */
  async startPayment(
    paymentData: PayHerePaymentData,
    callbacks?: Partial<PayHereCallbacks>
  ): Promise<PayHerePaymentResult> {
    try {
      console.log('=== PayHere Payment Starting ===');
      console.log('Payment data:', {
        orderId: paymentData.order_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        merchant: paymentData.merchant_id,
        sandbox: paymentData.sandbox
      });

      // Ensure PayHere is initialized
      await this.initialize();

      if (!window.payhere) {
        throw new Error('PayHere SDK not available after initialization');
      }

      // Validate payment data
      this.validatePaymentData(paymentData);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('PayHere payment timeout');
          reject(new Error('Payment timeout - Please try again'));
        }, 300000); // 5 minute timeout

        // Setup PayHere callbacks
        window.payhere!.onCompleted = (orderId: string) => {
          clearTimeout(timeout);
          console.log('PayHere payment completed:', orderId);
          callbacks?.onCompleted?.(orderId);
          resolve({
            success: true,
            orderId
          });
        };

        window.payhere!.onDismissed = () => {
          clearTimeout(timeout);
          console.log('PayHere payment dismissed by user');
          callbacks?.onDismissed?.();
          reject(new Error('Payment was cancelled by user'));
        };

        window.payhere!.onError = (error: string) => {
          clearTimeout(timeout);
          console.error('PayHere payment error:', error);
          callbacks?.onError?.(error);
          reject(new Error(`Payment failed: ${error}`));
        };

        // Start the payment
        console.log('Initiating PayHere payment...');
        console.log('PayHere object available:', !!window.payhere);
        console.log('PayHere startPayment function:', typeof window.payhere?.startPayment);

        if (!window.payhere || typeof window.payhere.startPayment !== 'function') {
          throw new Error('PayHere SDK not properly loaded');
        }

        window.payhere.startPayment(paymentData);
        console.log('PayHere startPayment called successfully');
      });

    } catch (error) {
      console.error('=== PayHere Payment Failed ===');
      console.error('Error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed'
      };
    }
  }

  /**
   * Validate payment data before sending to PayHere
   */
  private validatePaymentData(data: PayHerePaymentData): void {
    const requiredFields = [
      'merchant_id', 'order_id', 'amount', 'currency',
      'first_name', 'last_name', 'email', 'hash'
    ];

    const missingFields = requiredFields.filter(field => !data[field as keyof PayHerePaymentData]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required payment fields: ${missingFields.join(', ')}`);
    }

    // Validate amount format
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }

    console.log('PayHere payment data validation passed');
  }

  /**
   * Check if PayHere is available
   */
  isAvailable(): boolean {
    return !!window.payhere && this.isInitialized;
  }

  /**
   * Get PayHere status
   */
  getStatus(): { initialized: boolean; available: boolean; loading: boolean } {
    return {
      initialized: this.isInitialized,
      available: !!window.payhere,
      loading: !!this.initializationPromise && !this.isInitialized
    };
  }
}

// Export singleton instance
export const payHereService = PayHereService.getInstance();