import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ID.me OAuth configuration
const IDME_CLIENT_ID = process.env.IDME_CLIENT_ID!
const IDME_CLIENT_SECRET = process.env.IDME_CLIENT_SECRET!
const IDME_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/verification/idme/callback'

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

    // Store user ID in session for callback
    cookieStore.set('idme_verification_user', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    // Build ID.me authorization URL
    const params = new URLSearchParams({
      client_id: IDME_CLIENT_ID,
      redirect_uri: IDME_REDIRECT_URI,
      response_type: 'code',
      scope: 'military veteran first_responder teacher',
      state: user.id // Pass user ID as state for security
    })

    const authUrl = `https://api.id.me/oauth/authorize?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('ID.me init error:', error)
    return NextResponse.json({ error: 'Failed to initialize verification' }, { status: 500 })
  }
}

// Callback handler - separate file needed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, state } = body

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing verification code' }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.id.me/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${IDME_CLIENT_ID}:${IDME_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: IDME_REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    // Get user attributes from ID.me
    const attributesResponse = await fetch('https://api.id.me/api/public/v3/attributes', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!attributesResponse.ok) {
      throw new Error('Failed to fetch user attributes')
    }

    const attributes = await attributesResponse.json()

    // Determine service type from attributes
    let serviceType = null
    if (attributes.verified_military || attributes.verified_veteran) {
      serviceType = attributes.verified_veteran ? 'veteran' : 'military'
    } else if (attributes.verified_first_responder) {
      serviceType = 'first_responder'
    } else if (attributes.verified_teacher) {
      serviceType = 'teacher'
    } else if (attributes.verified_law_enforcement) {
      serviceType = 'law_enforcement'
    }

    if (!serviceType) {
      return NextResponse.json({ 
        error: 'No eligible service verification found' 
      }, { status: 400 })
    }

    // Update user in database
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

    const { error: updateError } = await supabase
      .from('users')
      .update({
        service_verified: true,
        service_type: serviceType,
        service_verification_date: new Date().toISOString(),
        idme_verification_id: attributes.uuid
      })
      .eq('id', state)

    if (updateError) {
      console.error('Error updating user verification:', updateError)
      return NextResponse.json({ error: 'Failed to save verification' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Verification successful',
      serviceType,
      discount: '15%'
    })
  } catch (error) {
    console.error('ID.me verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}