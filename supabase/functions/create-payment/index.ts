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
    address: string;
    city: string;
    country: string;
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
   * Hash = MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret))
   */
  private async generateHash(
    orderId: string,
    amount: string,
    currency: string
  ): Promise<string> {
    // Use Deno's std library for MD5
    const crypto_std = await import("https://deno.land/std@0.177.0/crypto/mod.ts");
    const encoder = new TextEncoder();

    // Step 1: Hash the merchant secret (like the working example)
    console.log('Step 1 - Hashing merchant secret...');
    const secretStr = String(this.config.merchantSecret);
    const secretData = encoder.encode(secretStr);
    const secretHashBuffer = await crypto_std.crypto.subtle.digest("MD5", secretData);
    const secretHashArray = Array.from(new Uint8Array(secretHashBuffer));
    const hashedSecret = secretHashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    console.log('Secret hash result:', {
      originalSecret: this.config.merchantSecret.substring(0, 10) + '...',
      hashedSecret: hashedSecret
    });

    // Step 2: Format amount like the working example
    const amountFormatted = parseFloat(amount).toFixed(2);

    // Step 3: Create the main hash string (like the working example)
    const hashString = String(this.config.merchantId) +
                      String(orderId) +
                      amountFormatted +
                      String(currency) +
                      hashedSecret;

    console.log('PayHere Hash Calculation (Detailed Debug):', {
      merchantId: this.config.merchantId,
      orderId,
      amount,
      currency,
      merchantSecret: this.config.merchantSecret.substring(0, 10) + '...',
      hashedSecret: hashedSecret,
      hashInput: hashString,
      hashInputLength: hashString.length
    });

    // Step 3: Hash the combined string
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto_std.crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    console.log('Generated PayHere hash (with correct format):', hash);
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

    console.log('Customer info received:', {
      firstName: request.customerInfo.firstName,
      lastName: request.customerInfo.lastName,
      email: request.customerInfo.email,
      phone: request.customerInfo.phone,
      address: request.customerInfo.address,
      city: request.customerInfo.city,
      country: request.customerInfo.country
    });

    const missingAddressFields = [];
    if (!request.customerInfo.address) missingAddressFields.push('address');
    if (!request.customerInfo.city) missingAddressFields.push('city');
    if (!request.customerInfo.country) missingAddressFields.push('country');

    if (missingAddressFields.length > 0) {
      throw new Error(`Missing required address information: ${missingAddressFields.join(', ')}`);
    }

    if (!request.items || request.items.length === 0) {
      throw new Error('At least one item is required');
    }

    // Additional PayHere-specific validations
    if (request.currency !== 'LKR' && request.currency !== 'USD' && request.currency !== 'GBP' && request.currency !== 'EUR' && request.currency !== 'AUD') {
      throw new Error(`Unsupported currency: ${request.currency}. PayHere supports: LKR, USD, GBP, EUR, AUD`);
    }

    if (request.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.customerInfo.email)) {
      throw new Error(`Invalid email format: ${request.customerInfo.email}`);
    }

    // Validate phone number format (should include country code)
    if (!request.customerInfo.phone.startsWith('+')) {
      console.warn('Phone number should include country code (+94, etc.)');
    }

    // Format amount like the working example (simple toFixed)
    const amountFormatted = parseFloat(request.amount.toString()).toFixed(2);

    console.log('Amount formatting:', {
      original: request.amount,
      formatted: amountFormatted
    });

    const hash = await this.generateHash(request.orderId, amountFormatted, request.currency);

    const paymentData: PayHerePaymentData = {
      merchant_id: this.config.merchantId,
      return_url: this.config.returnUrl,
      cancel_url: this.config.cancelUrl,
      notify_url: this.config.notifyUrl,
      order_id: request.orderId,
      items: request.items[0]?.itemName || 'Order Items',
      currency: request.currency,
      amount: amountFormatted,
      first_name: request.customerInfo.firstName,
      last_name: request.customerInfo.lastName,
      email: request.customerInfo.email,
      phone: request.customerInfo.phone,
      address: request.customerInfo.address,
      city: request.customerInfo.city,
      country: request.customerInfo.country,
      hash: hash
    };

    console.log('PayHere payment data created:', {
      orderId: paymentData.order_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      isProduction: this.config.isProduction,
      sandbox: paymentData.sandbox,
      hash: paymentData.hash
    });

    console.log('Complete PayHere payment data for debugging:', {
      merchant_id: paymentData.merchant_id,
      return_url: paymentData.return_url,
      cancel_url: paymentData.cancel_url,
      notify_url: paymentData.notify_url,
      order_id: paymentData.order_id,
      items: paymentData.items,
      currency: paymentData.currency,
      amount: paymentData.amount,
      first_name: paymentData.first_name,
      last_name: paymentData.last_name,
      email: paymentData.email,
      phone: paymentData.phone,
      address: paymentData.address,
      city: paymentData.city,
      country: paymentData.country,
      hash: paymentData.hash,
      sandbox: paymentData.sandbox
    });

    return paymentData;
  }

  /**
   * Get the appropriate checkout URL based on environment
   */
  getCheckoutUrl(): string {
    const url = this.config.isProduction
      ? 'https://www.payhere.lk/pay/checkout'
      : 'https://sandbox.payhere.lk/pay/checkout';

    console.log('PayHere checkout URL:', {
      isProduction: this.config.isProduction,
      url: url
    });

    return url;
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
    // For webhook to work, we need to configure it properly in Supabase settings
    // or use a different approach for public webhook access
    const notifyUrl = `${supabaseUrl}/functions/v1/payhere-webhook`;

    console.log('Webhook URL configured:', notifyUrl);

    console.log('PayHere URL Configuration:', {
      origin,
      returnUrl,
      cancelUrl,
      notifyUrl,
      supabaseUrl
    });

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