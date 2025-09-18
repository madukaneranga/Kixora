import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: number;
  md5sig: string;
  method: string;
  status_message: string;
  card_holder_name?: string;
  card_no?: string;
}

// PayHere webhook verification service
class PayHereWebhookService {
  private merchantId: string;
  private merchantSecret: string;

  constructor(merchantId: string, merchantSecret: string) {
    this.merchantId = merchantId;
    this.merchantSecret = merchantSecret;
  }

  /**
   * Verify webhook signature according to PayHere documentation
   * Webhook Hash = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret))
   * This is DIFFERENT from payment creation hash format
   */
  async verifyWebhookHash(
    orderId: string,
    amount: string,
    currency: string,
    statusCode: number,
    receivedHash: string
  ): Promise<boolean> {
    const crypto_std = await import("https://deno.land/std@0.177.0/crypto/mod.ts");
    const encoder = new TextEncoder();

    // Step 1: Hash the merchant secret
    const secretStr = String(this.merchantSecret);
    const secretData = encoder.encode(secretStr);
    const secretHashBuffer = await crypto_std.crypto.subtle.digest("MD5", secretData);
    const secretHashArray = Array.from(new Uint8Array(secretHashBuffer));
    const hashedSecret = secretHashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Step 2: Create the webhook hash string (DIFFERENT from payment hash)
    // PayHere webhook format: merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret)
    const hashString = String(this.merchantId) +
                      String(orderId) +
                      String(amount) +
                      String(currency) +
                      String(statusCode) +
                      hashedSecret;


    // Step 3: Hash the combined string
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto_std.crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const isValid = calculatedHash === receivedHash.toUpperCase();


    return isValid;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {

    // Initialize Supabase with service key (since this is a secure server-side operation)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PayHere configuration
    const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID');
    const merchantSecret = Deno.env.get('PAYHERE_SECRET');

    if (!merchantId || !merchantSecret) {
      console.error('Missing PayHere configuration');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize webhook service
    const webhookService = new PayHereWebhookService(merchantId, merchantSecret);

    // Parse webhook payload - PayHere sends form data, not JSON
    const formData = await req.formData();
    const payload: WebhookPayload = {
      merchant_id: formData.get('merchant_id') as string,
      order_id: formData.get('order_id') as string,
      payhere_amount: formData.get('payhere_amount') as string,
      payhere_currency: formData.get('payhere_currency') as string,
      status_code: parseInt(formData.get('status_code') as string),
      md5sig: formData.get('md5sig') as string,
      method: formData.get('method') as string,
      status_message: formData.get('status_message') as string,
      card_holder_name: formData.get('card_holder_name') as string || undefined,
      card_no: formData.get('card_no') as string || undefined,
    };
    // Verify merchant ID matches
    if (payload.merchant_id !== merchantId) {
      return new Response(JSON.stringify({ error: 'Invalid merchant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify webhook signature
    const isValidSignature = await webhookService.verifyWebhookHash(
      payload.order_id,
      payload.payhere_amount,
      payload.payhere_currency,
      payload.status_code,
      payload.md5sig
    );

    if (!isValidSignature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', payload.order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine order and payment status based on PayHere status code
    let orderStatus: string;
    let paymentStatus: string;

    switch (payload.status_code) {
      case 2:
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
        break;
      case -1:
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
        break;
      case -2:
        orderStatus = 'pending';
        paymentStatus = 'pending';
        break;
      default:
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
    }

    // Update order status (only existing columns)
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_status: paymentStatus,
        payment_provider_id: payload.order_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.order_id);

    if (updateError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order update failed',
        details: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If payment is successful, update inventory
    if (paymentStatus === 'paid') {
      try {
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_variant_id, quantity')
          .eq('order_id', payload.order_id);

        if (!itemsError && orderItems && orderItems.length > 0) {
          for (const item of orderItems) {
            await supabase.rpc('decrement_variant_stock', {
              variant_id: item.product_variant_id,
              quantity: item.quantity
            });
          }
        }
      } catch (stockUpdateError) {
        // Don't fail the webhook for stock update errors
      }
    }


    return new Response(JSON.stringify({
      success: true,
      orderId: payload.order_id,
      status: orderStatus,
      paymentStatus,
      message: 'Webhook processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Webhook processing failed',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});