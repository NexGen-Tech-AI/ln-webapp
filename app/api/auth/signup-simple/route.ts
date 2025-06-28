import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/services/emailService'

// Create Supabase admin client
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

// Generate unique referral code
async function generateReferralCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  
  // Keep trying until we get a unique code
  while (true) {
    code = ''
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    
    // Check if code already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .single()
    
    if (!existing) break
  }
  
  return code
}

// Get next position from sequence
async function getNextPosition(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .rpc('nextval', { sequence_name: 'users_position_seq' })
  
  if (error || !data) {
    // Fallback: get max position and add 1
    const { data: maxData } = await supabaseAdmin
      .from('users')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single()
    
    return (maxData?.position || 99) + 1
  }
  
  return data
}

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

    // First, find referrer if referral code provided
    let referrerId: string | null = null
    if (body.referralCode) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', body.referralCode)
        .single()
      
      if (referrer) {
        referrerId = referrer.id
      }
    }

    // Generate unique referral code for new user
    const newUserReferralCode = await generateReferralCode()
    const position = await getNextPosition()

    // Create auth user with all metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: false, // Proper email verification
      user_metadata: {
        name: body.name || '',
        profession: body.profession || '',
        company: body.company || '',
        interests: body.interests || [],
        tier_preference: body.tierPreference || 'free',
        referred_by: referrerId,
        user_type: 'waitlist',
        auth_provider: 'email',
        referral_code: newUserReferralCode,
        position: position
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

    // The handle_new_user() trigger will create the user profile
    // But we need to ensure referral tracking is handled
    if (authData.user && referrerId) {
      // Create referral tracking entry
      const { error: trackingError } = await supabaseAdmin
        .from('referral_tracking')
        .insert({
          referrer_id: referrerId,
          referred_id: authData.user.id,
          subscription_tier: body.tierPreference || 'free',
          subscription_amount: 0
        })
      
      if (trackingError) {
        console.error('Referral tracking error:', trackingError)
      }
      
      // Increment referral count
      const { error: incrementError } = await supabaseAdmin
        .rpc('increment_referral_count', { 
          user_id: referrerId 
        })
      
      if (incrementError) {
        console.error('Increment referral count error:', incrementError)
      }
    }

    // Create default notification preferences
    if (authData.user) {
      await supabaseAdmin
        .from('notification_preferences')
        .insert({
          user_id: authData.user.id,
          email_referral_milestone: true,
          email_referral_converted: true,
          email_product_updates: true,
          email_marketing: false
        })
    }

    // Log signup
    if (authData.user) {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: authData.user.id,
          action: 'user_signup',
          entity_type: 'user',
          entity_id: authData.user.id,
          details: {
            method: 'email',
            referred_by: referrerId,
            tier_preference: body.tierPreference
          },
          ip_address: request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })
    }

    // Send custom welcome email with verification link
    if (authData.user?.email) {
      // Generate verification link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: authData.user.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/confirm`
        }
      })
      
      if (linkError) {
        console.error('Email verification link error:', linkError)
      } else if (linkData?.properties?.hashed_token) {
        // Send custom welcome email using Resend
        const emailResult = await sendWelcomeEmail({
          email: authData.user.email,
          userName: body.name || authData.user.email.split('@')[0],
          verificationToken: linkData.properties.hashed_token
        })
        
        if (!emailResult.success) {
          console.error('Failed to send welcome email:', emailResult.error)
        }
      }
    }

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        userId: authData.user?.id,
        email: authData.user?.email,
        requiresEmailConfirmation: true
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

// Create increment function using RPC if needed
// Note: This function should be created by the migration, this is just a fallback
async function createIncrementFunctionIfNeeded(): Promise<void> {
  try {
    await supabaseAdmin.rpc('increment_referral_count', { user_id: '00000000-0000-0000-0000-000000000000' })
  } catch (error: any) {
    if (error?.message?.includes('function') && error?.message?.includes('does not exist')) {
      // Function doesn't exist, create it
      const { error: createError } = await supabaseAdmin
        .from('_migrations')
        .insert({
          name: 'increment_referral_count_function',
          executed_at: new Date().toISOString()
        })
      
      if (createError) {
        console.error('Could not create increment function marker:', createError)
      }
    }
  }
}