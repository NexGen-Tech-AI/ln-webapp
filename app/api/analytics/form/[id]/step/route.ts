import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id
    const body = await request.json()

    const { data: currentForm, error: fetchError } = await supabaseAdmin
      .from('form_analytics')
      .select('time_per_step')
      .eq('id', formId)
      .single()

    if (fetchError) throw fetchError

    const timePerStep = currentForm.time_per_step || []
    timePerStep.push({ step: body.step, time: body.time_spent || 0 })

    const { error } = await supabaseAdmin
      .from('form_analytics')
      .update({
        step_reached: body.step,
        time_per_step: timePerStep
      })
      .eq('id', formId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Form step update error:', error)
    return NextResponse.json(
      { error: 'Failed to update form step' },
      { status: 500 }
    )
  }
}