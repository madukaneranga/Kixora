import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsletterSubscriptionRequest {
  email: string
  source?: string
}

interface ResendEmailRequest {
  from: string
  to: string[]
  subject: string
  html: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, source = 'footer' }: NewsletterSubscriptionRequest = await req.json()

    // Validate email
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Valid email is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user ID if authenticated
    const authHeader = req.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser(
          authHeader.replace('Bearer ', '')
        )
        userId = user?.id || null
      } catch (error) {
        console.warn('Could not get user from auth header:', error)
      }
    }

    // Subscribe to newsletter using database function
    const { data: subscriptionResult, error: subscriptionError } = await supabaseClient
      .rpc('subscribe_to_newsletter', {
        p_email: email.toLowerCase().trim(),
        p_source: source,
        p_user_id: userId
      })

    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to subscribe to newsletter'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If already subscribed, return early
    if (!subscriptionResult.success) {
      return new Response(
        JSON.stringify(subscriptionResult),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send welcome email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey && (subscriptionResult.action === 'subscribed' || subscriptionResult.action === 'resubscribed')) {
      try {
        // Get unsubscribe token for the email
        const { data: subscriberData } = await supabaseClient
          .from('newsletter_subscribers')
          .select('unsubscribe_token')
          .eq('email', email.toLowerCase().trim())
          .single()

        const unsubscribeToken = subscriberData?.unsubscribe_token
        const unsubscribeUrl = `${Deno.env.get('SITE_URL') || 'https://kixora.com'}/unsubscribe?token=${unsubscribeToken}`

        const welcomeEmailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Kixora Newsletter</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #000; margin-bottom: 10px;">Welcome to Kixora!</h1>
                <p style="color: #666; font-size: 16px;">Thank you for subscribing to our newsletter</p>
              </div>

              <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #000; margin-top: 0;">What to expect:</h2>
                <ul style="color: #666; padding-left: 20px;">
                  <li>Exclusive access to new product releases</li>
                  <li>Special discount codes and promotions</li>
                  <li>Style tips and footwear trends</li>
                  <li>Behind-the-scenes content</li>
                </ul>
              </div>

              <div style="text-align: center; margin-bottom: 25px;">
                <p style="color: #666;">Follow us on social media for daily updates:</p>
                <div style="margin: 15px 0;">
                  <a href="#" style="color: #000; text-decoration: none; margin: 0 10px;">Facebook</a>
                  <a href="#" style="color: #000; text-decoration: none; margin: 0 10px;">TikTok</a>
                  <a href="#" style="color: #000; text-decoration: none; margin: 0 10px;">Instagram</a>
                </div>
              </div>

              <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px;">
                  You're receiving this email because you subscribed to the Kixora newsletter.<br>
                  <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> |
                  <a href="mailto:support@kixora.com" style="color: #666;">Contact Support</a>
                </p>
              </div>
            </body>
          </html>
        `

        const emailRequest: ResendEmailRequest = {
          from: 'Kixora <noreply@inkixora.com>',
          to: [email],
          subject: 'Welcome to Kixora Newsletter! 👟',
          html: welcomeEmailHtml
        }

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailRequest),
        })

        if (!resendResponse.ok) {
          const resendError = await resendResponse.text()
          console.error('Resend API error:', resendError)
          // Don't fail the subscription if email fails
        } else {
          console.log('Welcome email sent successfully')
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail the subscription if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: subscriptionResult.action === 'resubscribed'
          ? 'Successfully resubscribed to newsletter! Check your email for confirmation.'
          : 'Successfully subscribed to newsletter! Check your email for confirmation.',
        action: subscriptionResult.action
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})