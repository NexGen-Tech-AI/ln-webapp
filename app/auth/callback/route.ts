import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    )
  }

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange code for session
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        throw sessionError
      }

      if (data?.user) {
        // Check if user profile exists
        const { data: existingUser, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (fetchError && fetchError.code === 'PGSQL:42P01') {
          // Table doesn't exist - this is a setup issue
          console.error('Users table not found')
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
        }

        // If user doesn't exist in our users table, create profile
        if (!existingUser) {
          // Extract name from OAuth provider data
          const name = data.user.user_metadata?.full_name || 
                      data.user.user_metadata?.name || 
                      data.user.email?.split('@')[0] || 
                      'User'

          // Generate a unique referral code
          const referralCode = `${name.substring(0, 3).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

          // Create user profile
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: name,
              referral_code: referralCode,
              interests: [],
              tier_preference: 'free',
              position: 0, // Will be updated by trigger
              joined_at: new Date().toISOString(),
              last_login: new Date().toISOString(),
              email_verified: data.user.email_confirmed_at ? true : false,
              // OAuth provider info
              auth_provider: data.user.app_metadata?.provider || 'oauth',
              avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture
            })

          if (insertError) {
            console.error('Error creating user profile:', insertError)
            // Continue anyway - user is authenticated
          }
        } else {
          // Update last login for existing user
          await supabaseAdmin
            .from('users')
            .update({ 
              last_login: new Date().toISOString(),
              // Update avatar if provided by OAuth
              avatar_url: data.user.user_metadata?.avatar_url || 
                         data.user.user_metadata?.picture || 
                         existingUser.avatar_url
            })
            .eq('id', data.user.id)
        }

        // Log the OAuth login
        const { error: auditError } = await supabaseAdmin
          .from('audit_logs')
          .insert({
            user_id: data.user.id,
            action: 'oauth_login',
            details: {
              provider: data.user.app_metadata?.provider,
              email: data.user.email,
              ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
              user_agent: request.headers.get('user-agent')
            }
          })
        
        if (auditError) {
          console.error('Audit log error:', auditError)
        }

        // Redirect to dashboard or intended destination
        return NextResponse.redirect(new URL(next, requestUrl.origin))
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL('/login?error=auth_callback_failed', requestUrl.origin)
      )
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
}