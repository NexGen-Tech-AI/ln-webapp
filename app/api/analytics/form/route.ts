import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headersList = headers()
    
    const formData = {
      session_id: body.session_id,
      form_name: body.form_name,
      total_steps: body.total_steps,
      step_reached: body.step_reached || 1
    }

    // Get authenticated user if available
    const authHeader = headersList.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) {
        formData.user_id = user.id
      }
    }

    const { data, error } = await supabaseAdmin
      .from('form_analytics')
      .insert(formData)
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Form tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track form' },
      { status: 500 }
    )
  }
}