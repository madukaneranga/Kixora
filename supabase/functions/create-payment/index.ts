import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// PayHere Service - All-in-one implementation for Supabase Edge Functions
interface PayHereConfig {
  merchantId: string;
  merchantSecret: string;
  isProduction: boolean;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

interface PaymentRequest {
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

interface PayHerePaymentData {
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

class PayHereService {
  private config: PayHereConfig;

  constructor(config: PayHereConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.merchantId || !this.config.merchantSecret) {
      throw new Error('PayHere merchant credentials are required');
    }

    if (!this.config.returnUrl || !this.config.cancelUrl || !this.config.notifyUrl) {
      throw new Error('PayHere URLs (return, cancel, notify) are required');
    }
  }

  /**
   * Generate PayHere payment hash according to official documentation
   * Hash = MD5(merchant_id + order_id + amount + currency + merchant_secret)
   */
  private async generateHash(
    orderId: string,
    amount: string,
    currency: string
  ): Promise<string> {
    const hashString = [
      this.config.merchantId,
      orderId,
      amount,
      currency,
      this.config.merchantSecret
    ].join('').toUpperCase();

    console.log('PayHere Hash Calculation:', {
      merchantId: this.config.merchantId,
      orderId,
      amount,
      currency,
      hashInput: hashString.substring(0, 50) + '...'
    });

    // Use Deno's std library for MD5
    const crypto_std = await import("https://deno.land/std@0.177.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto_std.crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    console.log('Generated PayHere hash:', hash);
    return hash;
  }

  /**
   * Create PayHere payment data with proper validation
   */
  async createPaymentData(request: PaymentRequest): Promise<PayHerePaymentData> {
    // Validate request
    if (!request.orderId || !request.amount || !request.currency) {
      throw new Error('Missing required payment parameters');
    }

    if (!request.customerInfo.firstName || !request.customerInfo.lastName || !request.customerInfo.email) {
      throw new Error('Missing required customer information');
    }

    if (!request.items || request.items.length === 0) {
      throw new Error('At least one item is required');
    }

    const amount = request.amount.toFixed(2);
    const hash = await this.generateHash(request.orderId, amount, request.currency);

    const paymentData: PayHerePaymentData = {
      merchant_id: this.config.merchantId,
      return_url: this.config.returnUrl,
      cancel_url: this.config.cancelUrl,
      notify_url: this.config.notifyUrl,
      order_id: request.orderId,
      items: request.items[0]?.itemName || 'Order Items',
      currency: request.currency,
      amount: amount,
      first_name: request.customerInfo.firstName,
      last_name: request.customerInfo.lastName,
      email: request.customerInfo.email,
      phone: request.customerInfo.phone,
      address: 'N/A',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash: hash,
      sandbox: !this.config.isProduction
    };

    console.log('PayHere payment data created:', {
      orderId: paymentData.order_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      isProduction: this.config.isProduction,
      sandbox: paymentData.sandbox,
      hash: paymentData.hash
    });

    return paymentData;
  }

  /**
   * Get the appropriate checkout URL based on environment
   */
  getCheckoutUrl(): string {
    return this.config.isProduction
      ? 'https://www.payhere.lk/pay/checkout'
      : 'https://sandbox.payhere.lk/pay/checkout';
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== PayHere Payment Creation Started ===');

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({
        success: false,
        error: 'Server configuration error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authClient = supabaseAnonKey
      ? createClient(supabaseUrl, supabaseAnonKey)
      : supabase;

    // Get PayHere configuration
    const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID');
    const merchantSecret = Deno.env.get('PAYHERE_SECRET');
    const payHereEnvironment = Deno.env.get('PAYHERE_ENVIRONMENT') || 'sandbox';
    const isProduction = payHereEnvironment?.toLowerCase() === 'production';

    console.log('PayHere Environment Debug:', {
      rawEnvironment: Deno.env.get('PAYHERE_ENVIRONMENT'),
      payHereEnvironment,
      isProduction
    });

    console.log('Environment Configuration:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
      hasMerchantId: !!merchantId,
      hasSecret: !!merchantSecret,
      payHereEnvironment,
      isProduction
    });

    if (!merchantId || !merchantSecret) {
      console.error('Missing PayHere credentials');
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment gateway configuration error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Configure URLs
    const origin = req.headers.get('origin') || 'https://inkixora.com';
    const returnUrl = Deno.env.get('PAYHERE_RETURN_URL') || `${origin}/payment/success`;
    const cancelUrl = Deno.env.get('PAYHERE_CANCEL_URL') || `${origin}/payment/cancel`;
    const notifyUrl = `${supabaseUrl}/functions/v1/payment-webhook`;

    // Initialize PayHere service
    let payHereService: PayHereService;
    try {
      payHereService = new PayHereService({
        merchantId,
        merchantSecret,
        isProduction,
        returnUrl,
        cancelUrl,
        notifyUrl
      });
      console.log('PayHere service initialized successfully');
    } catch (serviceError) {
      console.error('PayHere service initialization failed:', serviceError.message);
      return new Response(JSON.stringify({
        success: false,
        error: `PayHere service error: ${serviceError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authentication token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Parse and validate request
    const paymentRequest: PaymentRequest = await req.json();
    console.log('Payment request:', {
      orderId: paymentRequest.orderId,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      customerEmail: paymentRequest.customerInfo.email
    });

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', paymentRequest.orderId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (orderError || !order) {
      console.error('Order verification failed:', orderError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found or invalid'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Order verified:', order.id);

    // Create PayHere payment data
    let paymentData: PayHerePaymentData;
    let checkoutUrl: string;

    try {
      paymentData = await payHereService.createPaymentData(paymentRequest);
      checkoutUrl = payHereService.getCheckoutUrl();
      console.log('PayHere payment data created successfully');
    } catch (paymentError) {
      console.error('PayHere payment data creation failed:', paymentError.message);
      return new Response(JSON.stringify({
        success: false,
        error: `Payment data creation failed: ${paymentError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update order with payment provider info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_provider: 'payhere',
        payment_provider_id: paymentRequest.orderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRequest.orderId);

    if (updateError) {
      console.error('Order update failed:', updateError.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update order'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('=== PayHere Payment Creation Completed Successfully ===');

    return new Response(JSON.stringify({
      success: true,
      paymentId: paymentRequest.orderId,
      paymentData,
      checkoutUrl,
      environment: isProduction ? 'production' : 'sandbox'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('=== PayHere Payment Creation Failed ===');
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);

    return new Response(JSON.stringify({
      success: false,
      error: 'Payment creation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});