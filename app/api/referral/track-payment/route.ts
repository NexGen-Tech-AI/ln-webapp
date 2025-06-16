import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, subscriptionTier, subscriptionAmount } = body

    // This endpoint should be called when a user subscribes/pays
    // Typically from your payment webhook (Stripe, etc.)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Update user as paying
    const { error: userError } = await supabase
      .from('users')
      .update({
        is_paying: true,
        subscription_tier: subscriptionTier,
        subscription_amount: subscriptionAmount
      })
      .eq('id', userId)

    if (userError) {
      console.error('Error updating user payment status:', userError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Update referral tracking if this user was referred
    const { data: referralData, error: referralError } = await supabase
      .from('referral_tracking')
      .update({
        became_paying_at: new Date().toISOString(),
        subscription_tier: subscriptionTier,
        subscription_amount: subscriptionAmount
      })
      .eq('referred_id', userId)
      .is('became_paying_at', null)
      .select()

    if (referralError) {
      console.error('Error updating referral tracking:', referralError)
      // Don't fail the whole operation if referral update fails
    }

    // If a referral was updated, check if referrer is eligible for credit
    if (referralData && referralData.length > 0) {
      const referrerId = referralData[0].referrer_id

      // Check and potentially auto-create credit
      const { data: eligibility } = await supabase
        .rpc('check_referral_credit_eligibility', { p_user_id: referrerId })

      if (eligibility?.eligible) {
        // Auto-create credit for eligible referrers
        const referralIds = eligibility.eligible_referrals.map((r: any) => r.id)
        await supabase.rpc('create_referral_credit', {
          p_user_id: referrerId,
          p_referral_ids: referralIds
        })

        // TODO: Send email notification about new credit
      }
    }

    return NextResponse.json({
      message: 'Payment tracking updated successfully',
      referralUpdated: (referralData?.length || 0) > 0
    })
  } catch (error) {
    console.error('Payment tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}