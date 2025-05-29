import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { emailService } from '@/services/email'

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In production, verify this is an admin user
    // For now, we'll use a simple secret token
    const adminSecret = process.env.ADMIN_SECRET
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { updateId } = await request.json()

    if (!updateId) {
      return NextResponse.json(
        { error: 'Update ID is required' },
        { status: 400 }
      )
    }

    // Send notifications
    const result = await emailService.sendUpdateNotification(updateId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Notifications sent successfully',
      sent: result.sent,
      failed: result.failed
    })
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}