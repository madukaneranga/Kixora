import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get PayHere secret from environment
    const payHereSecret = Deno.env.get('PAYHERE_SECRET')!

    // Parse the webhook payload
    const payload: WebhookPayload = await req.json()

    // Verify the signature
    const hashString = [
      payload.merchant_id,
      payload.order_id,
      payload.payhere_amount,
      payHereSecret,
      payload.status_code
    ].join('').toUpperCase()

    // Use Deno's built-in crypto for MD5
    const crypto_std = await import("https://deno.land/std@0.177.0/crypto/mod.ts")
    const encoder = new TextEncoder()
    const data = encoder.encode(hashString)
    const hashBuffer = await crypto_std.crypto.subtle.digest("MD5", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

    if (hashHex !== payload.md5sig) {
      return new Response('Invalid signature', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', payload.order_id)
      .single()

    if (orderError || !order) {
      return new Response('Order not found', {
        status: 404,
        headers: corsHeaders
      })
    }

    // Determine order and payment status based on PayHere status code
    let orderStatus: string
    let paymentStatus: string
    switch (payload.status_code) {
      case 2:
        orderStatus = 'confirmed'
        paymentStatus = 'paid'
        break
      case -2:
        orderStatus = 'pending'
        paymentStatus = 'pending'
        break
      default:
        orderStatus = 'cancelled'
        paymentStatus = 'failed'
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_status: paymentStatus,
        payment_provider_id: payload.order_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.order_id)

    if (updateError) {
      throw updateError
    }

    // If payment is successful, update inventory
    if (paymentStatus === 'paid') {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_variant_id, quantity')
        .eq('order_id', payload.order_id)

      if (itemsError) {
        throw itemsError
      }

      // Update stock for each variant
      for (const item of orderItems) {
        const { error: stockError } = await supabase.rpc('decrement_variant_stock', {
          variant_id: item.product_variant_id,
          quantity: item.quantity
        })

        if (stockError) {
          console.error('Error updating stock:', stockError)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})