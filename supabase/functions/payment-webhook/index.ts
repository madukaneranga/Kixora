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
   * Hash = MD5(merchant_id + order_id + amount + merchant_secret + status_code)
   */
  async verifyWebhookHash(
    orderId: string,
    amount: string,
    statusCode: number,
    receivedHash: string
  ): Promise<boolean> {
    const hashString = [
      this.merchantId,
      orderId,
      amount,
      this.merchantSecret,
      statusCode
    ].join('').toUpperCase();

    console.log('Webhook hash verification input:', {
      merchantId: this.merchantId,
      orderId,
      amount,
      statusCode,
      hashInput: hashString.substring(0, 50) + '...'
    });

    // Use Deno's std library for MD5
    const crypto_std = await import("https://deno.land/std@0.177.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto_std.crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const isValid = calculatedHash === receivedHash.toUpperCase();

    console.log('Webhook hash verification result:', {
      calculatedHash,
      receivedHash: receivedHash.toUpperCase(),
      isValid
    });

    return isValid;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== PayHere Webhook Received ===');

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response('Configuration error', { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PayHere configuration
    const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID');
    const merchantSecret = Deno.env.get('PAYHERE_SECRET');
    const isProduction = Deno.env.get('PAYHERE_ENVIRONMENT') === 'production';

    console.log('Webhook environment:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasMerchantId: !!merchantId,
      hasSecret: !!merchantSecret,
      isProduction
    });

    if (!merchantId || !merchantSecret) {
      console.error('Missing PayHere configuration');
      return new Response('Configuration error', { status: 500, headers: corsHeaders });
    }

    // Initialize webhook service
    const webhookService = new PayHereWebhookService(merchantId, merchantSecret);

    // Parse webhook payload
    const payload: WebhookPayload = await req.json();
    console.log('Webhook payload received:', {
      orderId: payload.order_id,
      amount: payload.payhere_amount,
      currency: payload.payhere_currency,
      statusCode: payload.status_code,
      method: payload.method,
      merchantId: payload.merchant_id
    });

    // Verify merchant ID matches
    if (payload.merchant_id !== merchantId) {
      console.error('Merchant ID mismatch:', {
        received: payload.merchant_id,
        expected: merchantId
      });
      return new Response('Invalid merchant', { status: 400, headers: corsHeaders });
    }

    // Verify webhook signature
    const isValidSignature = await webhookService.verifyWebhookHash(
      payload.order_id,
      payload.payhere_amount,
      payload.status_code,
      payload.md5sig
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 400, headers: corsHeaders });
    }

    console.log('Webhook signature verified successfully');

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', payload.order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError?.message);
      return new Response('Order not found', { status: 404, headers: corsHeaders });
    }

    console.log('Order found for webhook:', order.id);

    // Determine order and payment status based on PayHere status code
    let orderStatus: string;
    let paymentStatus: string;

    switch (payload.status_code) {
      case 2:
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
        console.log('Payment successful');
        break;
      case -1:
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
        console.log('Payment failed');
        break;
      case -2:
        orderStatus = 'pending';
        paymentStatus = 'pending';
        console.log('Payment pending');
        break;
      default:
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
        console.log('Payment failed with unknown status:', payload.status_code);
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_status: paymentStatus,
        payment_provider_id: payload.order_id,
        payment_method_details: {
          method: payload.method,
          status_message: payload.status_message,
          card_holder_name: payload.card_holder_name,
          card_no: payload.card_no,
          webhook_received_at: new Date().toISOString(),
          status_code: payload.status_code
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.order_id);

    if (updateError) {
      console.error('Failed to update order:', updateError.message);
      return new Response('Update failed', { status: 500, headers: corsHeaders });
    }

    console.log('Order updated successfully:', {
      orderId: payload.order_id,
      newStatus: orderStatus,
      paymentStatus
    });

    // If payment is successful, update inventory
    if (paymentStatus === 'paid') {
      try {
        console.log('Processing inventory updates for successful payment...');

        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_variant_id, quantity')
          .eq('order_id', payload.order_id);

        if (itemsError) {
          console.error('Failed to fetch order items:', itemsError.message);
        } else if (orderItems && orderItems.length > 0) {
          console.log(`Processing ${orderItems.length} order items for inventory update`);

          // Update stock for each variant
          for (const item of orderItems) {
            const { error: stockError } = await supabase.rpc('decrement_variant_stock', {
              variant_id: item.product_variant_id,
              quantity: item.quantity
            });

            if (stockError) {
              console.error('Error updating stock for variant:', item.product_variant_id, stockError.message);
            } else {
              console.log('Stock updated for variant:', item.product_variant_id, 'quantity:', item.quantity);
            }
          }

          console.log('Inventory updates completed');
        } else {
          console.log('No order items found for inventory update');
        }
      } catch (stockUpdateError) {
        console.error('Stock update process failed:', stockUpdateError);
        // Don't fail the webhook for stock update errors
      }
    }

    console.log('=== PayHere Webhook Processed Successfully ===');

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
    console.error('=== PayHere Webhook Processing Failed ===');
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);

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