import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update user payment status
        if (session.customer && session.metadata?.userId) {
          const { error } = await supabaseAdmin
            .from('payment_methods')
            .upsert({
              user_id: session.metadata.userId,
              stripe_customer_id: session.customer as string,
              selected_tier: session.metadata.tier || 'pro',
              auto_enroll: true
            })

          if (!error) {
            // Track payment for referral system
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/referral/track-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: session.metadata.userId,
                subscriptionTier: session.metadata.tier || 'pro',
                subscriptionAmount: (session.amount_total || 0) / 100
              })
            })
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update user subscription details
        if (subscription.metadata?.userId) {
          const { error } = await supabaseAdmin
            .from('users')
            .update({
              is_paying: subscription.status === 'active',
              subscription_tier: subscription.metadata.tier,
              subscription_amount: subscription.items.data[0].price.unit_amount! / 100
            })
            .eq('id', subscription.metadata.userId)

          if (error) {
            console.error('Error updating subscription:', error)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Handle subscription cancellation
        if (subscription.metadata?.userId) {
          await supabaseAdmin
            .from('users')
            .update({
              is_paying: false,
              subscription_tier: null,
              subscription_amount: null
            })
            .eq('id', subscription.metadata.userId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Log successful payment
        if (invoice.subscription_details?.metadata?.userId) {
          await supabaseAdmin
            .from('audit_logs')
            .insert({
              user_id: invoice.subscription_details.metadata.userId,
              action: 'payment_succeeded',
              details: {
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                invoice_id: invoice.id
              }
            })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Handle failed payment
        if (invoice.subscription_details?.metadata?.userId) {
          // Send email notification about failed payment
          await supabaseAdmin
            .from('email_queue')
            .insert({
              to_email: invoice.customer_email!,
              subject: 'Payment Failed - Action Required',
              html: `<p>Your payment of $${(invoice.amount_due / 100).toFixed(2)} failed. Please update your payment method.</p>`,
              text: `Your payment of $${(invoice.amount_due / 100).toFixed(2)} failed. Please update your payment method.`
            })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Stripe requires raw body for webhook verification
export const runtime = 'edge'