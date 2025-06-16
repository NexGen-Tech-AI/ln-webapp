import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { emailService } from '@/services/email'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  profession: z.string().optional(),
  company: z.string().optional(),
  interests: z.array(z.string()),
  tierPreference: z.string(),
  referralCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Create auth user with metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: false, // Don't auto-confirm, let them verify
      user_metadata: {
        name: validatedData.name,
        profession: validatedData.profession,
        company: validatedData.company,
        interests: validatedData.interests,
        tierPreference: validatedData.tierPreference,
        referralCode: validatedData.referralCode,
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // The trigger will handle initial user creation with metadata
    // Now we can safely upsert to ensure all data is saved
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authData.user.id,
          email: validatedData.email,
          name: validatedData.name,
          profession: validatedData.profession,
          company: validatedData.company,
          interests: validatedData.interests,
          tier_preference: validatedData.tierPreference,
          referred_by: validatedData.referralCode,
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Profile upsert error:', profileError)
        // Don't fail the whole signup if profile update fails
        // The trigger should have created the basic record
      }

      // Handle referral tracking if referral code was used
      if (validatedData.referralCode) {
        // Get referrer's user ID
        const { data: referrer } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('referral_code', validatedData.referralCode)
          .single()
        
        if (referrer) {
          // Create referral tracking entry
          const { error: trackingError } = await supabaseAdmin
            .from('referral_tracking')
            .insert({
              referrer_id: referrer.id,
              referred_id: authData.user.id,
              subscription_tier: validatedData.tierPreference,
              // If they selected a paid tier, track the potential revenue
              subscription_amount: validatedData.tierPreference === 'pro' ? 20 : 
                                 validatedData.tierPreference === 'ai' ? 99 : 
                                 validatedData.tierPreference === 'family' ? 35 : 0
            })
          
          if (trackingError) {
            console.error('Referral tracking error:', trackingError)
          }
          
          // Increment referral count
          await supabaseAdmin.rpc('increment_referral_count', { 
            referral_code: validatedData.referralCode 
          })
        }
      }

      // Log the signup
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: authData.user.id,
          action: 'user_signup',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
        })

      // Send welcome email
      await emailService.sendWelcomeEmail(authData.user.id)
    }

    return NextResponse.json(
      { message: 'User created successfully', userId: authData.user?.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}