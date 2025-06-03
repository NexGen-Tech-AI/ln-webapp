import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle errors from ID.me
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?verification=failed&error=${error}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?verification=failed&error=missing_params', request.url)
      )
    }

    // Verify state matches stored user
    const cookieStore = cookies()
    const storedUser = cookieStore.get('idme_verification_user')?.value

    if (!storedUser || storedUser !== state) {
      return NextResponse.redirect(
        new URL('/dashboard?verification=failed&error=invalid_state', request.url)
      )
    }

    // Clear the verification cookie
    cookieStore.delete('idme_verification_user')

    // Process the verification (call our POST endpoint)
    const verifyResponse = await fetch(new URL('/api/verification/idme', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state })
    })

    if (!verifyResponse.ok) {
      return NextResponse.redirect(
        new URL('/dashboard?verification=failed&error=processing_failed', request.url)
      )
    }

    const result = await verifyResponse.json()

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      new URL(`/dashboard?verification=success&service=${result.serviceType}&discount=${result.discount}`, request.url)
    )
  } catch (error) {
    console.error('ID.me callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?verification=failed&error=unexpected', request.url)
    )
  }
}