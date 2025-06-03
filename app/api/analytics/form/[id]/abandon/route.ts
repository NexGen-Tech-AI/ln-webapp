import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id
    const body = await request.json()

    const { error } = await supabaseAdmin
      .from('form_analytics')
      .update({
        abandoned: true,
        abandoned_at_step: body.abandoned_at_step,
        abandoned_reason: body.abandoned_reason,
        total_time_seconds: body.total_time_seconds
      })
      .eq('id', formId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Form abandon error:', error)
    return NextResponse.json(
      { error: 'Failed to track form abandonment' },
      { status: 500 }
    )
  }
}