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

    console.log('PayHere Webhook Hash Calculation (Production Ready):', {
      merchantId: this.merchantId,
      orderId,
      amount,
      currency,
      statusCode,
      merchantSecretHash: hashedSecret,
      concatenationOrder: 'merchant_id + order_id + amount + currency + status_code + MD5(secret)',
      hashInput: hashString,
      hashInputLength: hashString.length
    });

    // Step 3: Hash the combined string
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto_std.crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const isValid = calculatedHash === receivedHash.toUpperCase();

    console.log('PayHere Webhook Hash Verification Result:', {
      calculatedHash,
      receivedHash: receivedHash.toUpperCase(),
      isValid,
      orderId,
      statusCode,
      verificationTimestamp: new Date().toISOString()
    });

    if (!isValid) {
      console.error('❌ WEBHOOK SIGNATURE VERIFICATION FAILED', {
        orderId,
        expectedHash: calculatedHash,
        receivedHash: receivedHash.toUpperCase(),
        merchantId: this.merchantId,
        amount,
        currency,
        statusCode
      });
    } else {
      console.log('✅ WEBHOOK SIGNATURE VERIFIED SUCCESSFULLY', { orderId, statusCode });
    }

    return isValid;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('🚀 PUBLIC PAYHERE WEBHOOK CALLED - Method:', req.method, 'URL:', req.url, 'Time:', new Date().toISOString());
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request handled for CORS');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== PayHere Public Webhook Received ===');

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
    console.log('Webhook payload received:', {
      orderId: payload.order_id,
      amount: payload.payhere_amount,
      currency: payload.payhere_currency,
      statusCode: payload.status_code,
      method: payload.method,
      merchantId: payload.merchant_id,
      receivedHash: payload.md5sig
    });

    console.log('All form data received:', Object.fromEntries(formData.entries()));

    // Verify merchant ID matches
    if (payload.merchant_id !== merchantId) {
      console.error('Merchant ID mismatch:', {
        received: payload.merchant_id,
        expected: merchantId
      });
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
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

    console.log('Order update attempted:', {
      orderId: payload.order_id,
      newStatus: orderStatus,
      paymentStatus,
      paymentProviderId: payload.order_id
    });

    if (updateError) {
      console.error('Failed to update order:', updateError.message);
      console.error('Update error details:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Order update failed',
        details: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

    console.log('=== PayHere Public Webhook Processed Successfully ===');

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
    console.error('=== PayHere Public Webhook Processing Failed ===');
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