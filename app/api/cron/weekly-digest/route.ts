import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/services/email'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (you can set this up with Vercel Cron or similar)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Send weekly digest emails
    const result = await emailService.sendWeeklyDigest()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send weekly digest' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Weekly digest sent successfully',
      sent: result.sent
    })
  } catch (error) {
    console.error('Weekly digest error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}