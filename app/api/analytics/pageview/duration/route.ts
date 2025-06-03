import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { page_view_id, duration_seconds } = body

    // Update page view duration
    await supabaseAdmin.rpc('update_page_view_duration', {
      p_page_view_id: page_view_id,
      p_duration_seconds: duration_seconds
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Duration update error:', error)
    return NextResponse.json(
      { error: 'Failed to update duration' },
      { status: 500 }
    )
  }
}