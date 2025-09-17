import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreatePaymentRequest {
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Create payment function called')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing Supabase environment variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!supabaseAnonKey) {
      console.log('Warning: SUPABASE_ANON_KEY not found, using service role for auth')
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Use anon key for auth operations if available, otherwise service role
    const authClient = supabaseAnonKey
      ? createClient(supabaseUrl, supabaseAnonKey)
      : supabase

    // Get PayHere configuration
    const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID')
    const merchantSecret = Deno.env.get('PAYHERE_SECRET')

    console.log('PayHere config check:', {
      hasMerchantId: !!merchantId,
      hasSecret: !!merchantSecret
    })

    if (!merchantId || !merchantSecret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing PayHere environment variables. Please set PAYHERE_MERCHANT_ID and PAYHERE_SECRET'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const returnUrl = Deno.env.get('PAYHERE_RETURN_URL') || `${req.headers.get('origin')}/payment/success`
    const cancelUrl = Deno.env.get('PAYHERE_CANCEL_URL') || `${req.headers.get('origin')}/payment/cancel`
    const notifyUrl = `${supabaseUrl}/functions/v1/payment-webhook`

    // Parse request
    const paymentRequest: CreatePaymentRequest = await req.json()
    console.log('Payment request received:', { orderId: paymentRequest.orderId, amount: paymentRequest.amount })

    // Verify the order exists and belongs to authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header provided')
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization header is required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '')
    console.log('Auth token received:', token ? 'Present' : 'Missing')

    const { data: { user }, error: authError } = await authClient.auth.getUser(token)

    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid or expired authentication token: ${authError?.message || 'User not found'}`
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User authenticated:', user.id)

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', paymentRequest.orderId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (orderError || !order) {
      console.log('Order lookup failed:', orderError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found or invalid. Make sure the order exists and belongs to you.'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Order found:', order.id)

    // Create PayHere payment hash
    const hashString = [
      merchantId,
      paymentRequest.orderId,
      paymentRequest.amount.toFixed(2),
      paymentRequest.currency,
      merchantSecret
    ].join('').toUpperCase()

    // Use Deno's built-in crypto for MD5
    const crypto = await import("https://deno.land/std@0.177.0/crypto/mod.ts")
    const encoder = new TextEncoder()
    const data = encoder.encode(hashString)
    const hashBuffer = await crypto.crypto.subtle.digest("MD5", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

    // Create PayHere payment form data
    const paymentData = {
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id: paymentRequest.orderId,
      items: paymentRequest.items[0]?.itemName || 'SportPro Order',
      currency: paymentRequest.currency,
      amount: paymentRequest.amount.toFixed(2),
      first_name: paymentRequest.customerInfo.firstName,
      last_name: paymentRequest.customerInfo.lastName,
      email: paymentRequest.customerInfo.email,
      phone: paymentRequest.customerInfo.phone,
      address: 'N/A',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash: hash
    }

    // Update order with payment provider info
    await supabase
      .from('orders')
      .update({
        payment_provider: 'payhere',
        payment_provider_id: paymentRequest.orderId,
      })
      .eq('id', paymentRequest.orderId)

    return new Response(JSON.stringify({
      success: true,
      paymentId: paymentRequest.orderId,
      paymentData: paymentData,
      checkoutUrl: 'https://sandbox.payhere.lk/pay/checkout', // Use https://www.payhere.lk/pay/checkout for production
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to create payment' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})