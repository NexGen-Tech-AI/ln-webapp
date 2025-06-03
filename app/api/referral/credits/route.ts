import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's active credits
    const { data: credits, error: creditsError } = await supabase
      .from('referral_credits')
      .select('*')
      .eq('user_id', user.id)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })

    if (creditsError) {
      console.error('Error fetching credits:', creditsError)
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
    }

    // Get referral tracking stats
    const { data: trackingStats } = await supabase
      .from('referral_tracking')
      .select('id, became_paying_at, subscription_amount')
      .eq('referrer_id', user.id)

    const acknowledgedCount = trackingStats?.length || 0
    const payingCount = trackingStats?.filter(r => r.became_paying_at)?.length || 0
    const uncreditedPayingCount = trackingStats?.filter(r => 
      r.became_paying_at && !r.included_in_credit_batch
    )?.length || 0

    // Get user type to determine requirements
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const requiredReferrals = userData?.user_type === 'pilot' ? 5 
      : userData?.user_type === 'waitlist' ? 10 
      : 20

    return NextResponse.json({
      credits: credits || [],
      stats: {
        acknowledged: acknowledgedCount,
        paying: payingCount,
        uncredited_paying: uncreditedPayingCount,
        required: requiredReferrals,
        progress: `${payingCount}/${requiredReferrals}`,
        next_credit_in: Math.max(0, requiredReferrals - uncreditedPayingCount)
      }
    })
  } catch (error) {
    console.error('Credits API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
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

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check eligibility for credit
    const { data: eligibility, error: eligibilityError } = await supabase
      .rpc('check_referral_credit_eligibility', { p_user_id: user.id })

    if (eligibilityError) {
      console.error('Eligibility check error:', eligibilityError)
      return NextResponse.json({ error: 'Failed to check eligibility' }, { status: 500 })
    }

    if (!eligibility.eligible) {
      return NextResponse.json({
        message: 'Not eligible for credit yet',
        remaining_needed: eligibility.remaining_needed
      }, { status: 400 })
    }

    // Extract referral IDs
    const referralIds = eligibility.eligible_referrals.map((r: any) => r.id)

    // Create the credit
    const { data: creditId, error: creditError } = await supabase
      .rpc('create_referral_credit', {
        p_user_id: user.id,
        p_referral_ids: referralIds
      })

    if (creditError) {
      console.error('Credit creation error:', creditError)
      return NextResponse.json({ error: 'Failed to create credit' }, { status: 500 })
    }

    // Get the created credit details
    const { data: credit } = await supabase
      .from('referral_credits')
      .select('*')
      .eq('id', creditId)
      .single()

    return NextResponse.json({
      message: 'Credit created successfully',
      credit,
      referrals_credited: eligibility.referral_count
    })
  } catch (error) {
    console.error('Credit creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}