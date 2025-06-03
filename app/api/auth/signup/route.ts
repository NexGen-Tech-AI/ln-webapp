import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
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

      // Increment referral count if referral code was used
      if (validatedData.referralCode) {
        await supabaseAdmin.rpc('increment_referral_count', { 
          referral_code: validatedData.referralCode 
        })
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