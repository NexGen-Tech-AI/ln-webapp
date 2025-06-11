import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Helper function to determine reward tier based on average value
function getRewardTier(averageValue: number): string {
  if (averageValue >= 99) return 'ai'      // AI Navigator+ tier
  if (averageValue >= 35) return 'family'  // Family tier
  if (averageValue >= 20) return 'pro'     // Pro tier
  return 'free'                             // Free tier
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's referral code and detailed statistics
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_code, referral_count, paying_referral_count')
      .eq('id', user.id)
      .single()

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to get referral information' },
        { status: 500 }
      )
    }

    // Get detailed referral tracking data
    const { data: referralData, error: referralError } = await supabase
      .from('referral_tracking')
      .select('*')
      .eq('referrer_id', user.id)

    if (referralError) {
      console.error('Referral tracking error:', referralError)
    }

    // Calculate statistics
    const requiredReferrals = userData.user_type === 'pilot' ? 5 : 
                             userData.user_type === 'waitlist' ? 10 : 20
    
    const stats = {
      totalReferrals: userData.referral_count || 0,
      payingReferrals: userData.paying_referral_count || 0,
      waitlistReferrals: referralData?.filter(r => !r.became_paying_at).length || 0,
      potentialPayingUsers: 0,
      potentialRevenue: 0,
      tierBreakdown: {
        free: 0,
        pro: 0,
        ai: 0,
        family: 0
      },
      rewards: {
        requiredReferrals,
        currentBatch: 0,
        progressToNextReward: 0,
        completedBatches: Math.floor((userData.paying_referral_count || 0) / requiredReferrals),
        averageSubscriptionValue: 0,
        projectedRewardTier: 'free' as string,
        projectedRewardValue: 0,
        nextBatchAverageValue: 0,
        nextBatchProjectedTier: 'free' as string
      }
    }

    // Calculate potential paying users and revenue
    if (referralData && referralData.length > 0) {
      let totalSubscriptionValue = 0
      let payingCount = 0
      let nextBatchTotal = 0
      let nextBatchCount = 0
      
      // Sort by date to process in order
      const sortedReferrals = [...referralData].sort((a, b) => 
        new Date(a.acknowledged_at).getTime() - new Date(b.acknowledged_at).getTime()
      )
      
      sortedReferrals.forEach((referral) => {
        // Track tier preferences
        if (referral.subscription_tier && referral.subscription_tier in stats.tierBreakdown) {
          stats.tierBreakdown[referral.subscription_tier as keyof typeof stats.tierBreakdown]++
        }
        
        // For waitlist potential revenue
        if (!referral.became_paying_at && referral.subscription_amount > 0) {
          stats.potentialPayingUsers++
          stats.potentialRevenue += referral.subscription_amount
        }
        
        // For paying referrals, calculate average
        if (referral.became_paying_at && referral.subscription_amount > 0) {
          totalSubscriptionValue += referral.subscription_amount
          payingCount++
        }
        
        // Calculate next batch average (uncredited paying referrals)
        if (referral.became_paying_at && !referral.included_in_credit_batch && referral.subscription_amount > 0) {
          nextBatchTotal += referral.subscription_amount
          nextBatchCount++
        }
      })
      
      // Calculate average subscription value
      if (payingCount > 0) {
        stats.rewards.averageSubscriptionValue = totalSubscriptionValue / payingCount
      }
      
      // Calculate current batch progress
      const uncreditedPaying = sortedReferrals.filter(r => r.became_paying_at && !r.included_in_credit_batch).length
      stats.rewards.currentBatch = uncreditedPaying
      stats.rewards.progressToNextReward = Math.min(uncreditedPaying / requiredReferrals * 100, 100)
      
      // Calculate next batch average and projected tier
      if (nextBatchCount > 0) {
        stats.rewards.nextBatchAverageValue = nextBatchTotal / nextBatchCount
        stats.rewards.nextBatchProjectedTier = getRewardTier(stats.rewards.nextBatchAverageValue)
      }
      
      // Overall projected reward tier based on all paying referrals
      stats.rewards.projectedRewardTier = getRewardTier(stats.rewards.averageSubscriptionValue)
      stats.rewards.projectedRewardValue = stats.rewards.averageSubscriptionValue
    }
    

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const referralLink = `${baseUrl}/referral/${userData.referral_code}`

    return NextResponse.json({
      referralCode: userData.referral_code,
      referralLink,
      statistics: stats
    })
  } catch (error) {
    console.error('Get referral error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}