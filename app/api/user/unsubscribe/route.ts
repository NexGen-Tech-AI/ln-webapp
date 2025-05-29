import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  token: z.string(),
  type: z.enum(['all', 'updates', 'weekly_digest']).optional().default('all')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, type } = unsubscribeSchema.parse(body)

    // Decode the token (in production, use proper JWT or encrypted tokens)
    // For now, we'll use a simple base64 encoded email
    const email = Buffer.from(token, 'base64').toString('utf-8')

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 400 }
      )
    }

    // Update email preferences
    const updates: any = {}
    if (type === 'all') {
      updates.email_notifications = false
      updates.email_updates = false
      updates.email_weekly_digest = false
    } else if (type === 'updates') {
      updates.email_updates = false
    } else if (type === 'weekly_digest') {
      updates.email_weekly_digest = false
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    // Log the unsubscribe
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'email_unsubscribe',
        details: { type },
      })

    return NextResponse.json({
      message: 'Successfully unsubscribed',
      type
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method for direct link unsubscribes
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const type = searchParams.get('type') || 'all'

  if (!token) {
    return new NextResponse('Invalid unsubscribe link', { status: 400 })
  }

  // In production, return a proper unsubscribe page
  // For now, we'll just process the unsubscribe
  const response = await POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ token, type }),
    })
  )

  if (response.status === 200) {
    return new NextResponse(
      `<html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>Unsubscribed Successfully</h1>
          <p>You have been unsubscribed from ${type === 'all' ? 'all emails' : type.replace('_', ' ')}.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">Return to LifeNavigator</a></p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } else {
    return new NextResponse(
      `<html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>Unsubscribe Failed</h1>
          <p>There was an error processing your request. Please try again.</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}