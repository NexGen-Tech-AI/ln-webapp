import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client directly to avoid import issues
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Basic validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('Signup attempt for:', body.email)

    // Create auth user with all metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm for testing
      user_metadata: {
        name: body.name || '',
        profession: body.profession || '',
        company: body.company || '',
        interests: body.interests || [],
        tierPreference: body.tierPreference || 'free',
        referralCode: body.referralCode || '',
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    console.log('Auth user created:', authData.user?.id)

    // Manually insert/update user profile to ensure data is saved
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authData.user.id,
          email: body.email,
          name: body.name || '',
          profession: body.profession || '',
          company: body.company || '',
          interests: body.interests || [],
          tier_preference: body.tierPreference || 'free',
          referred_by: body.referralCode || null,
          user_type: 'waitlist',
          auth_provider: 'email',
          joined_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (profileError) {
        console.error('Profile error:', profileError)
        // Continue even if profile fails - user is created
      }

      // Handle referral if provided
      if (body.referralCode) {
        try {
          // Get referrer
          const { data: referrer } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('referral_code', body.referralCode)
            .single()
          
          if (referrer) {
            // Create referral tracking
            await supabaseAdmin
              .from('referral_tracking')
              .insert({
                referrer_id: referrer.id,
                referred_id: authData.user.id,
                subscription_tier: body.tierPreference || 'free',
                subscription_amount: 0
              })
            
            // Update referral count
            await supabaseAdmin
              .from('users')
              .update({ referral_count: supabaseAdmin.raw('referral_count + 1') })
              .eq('id', referrer.id)
          }
        } catch (refError) {
          console.error('Referral processing error:', refError)
          // Don't fail signup if referral fails
        }
      }

      // Log signup
      try {
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            user_id: authData.user.id,
            action: 'user_signup',
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          })
      } catch (logError) {
        console.error('Audit log error:', logError)
      }
    }

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        userId: authData.user?.id,
        email: authData.user?.email 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}