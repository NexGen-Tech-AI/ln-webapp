import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headersList = headers()
    
    const pageViewData = {
      session_id: body.session_id,
      page_path: body.page_path,
      page_title: body.page_title,
      referrer: body.referrer,
      referrer_source: body.referrer_source,
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
      utm_term: body.utm_term,
      utm_content: body.utm_content
    }

    // Get authenticated user if available
    const authHeader = headersList.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) {
        pageViewData.user_id = user.id
      }
    }

    const { data, error } = await supabaseAdmin
      .from('page_views')
      .insert(pageViewData)
      .select('id')
      .single()

    if (error) throw error

    // Update session page count
    await supabaseAdmin.rpc('increment', {
      table_name: 'user_sessions',
      column_name: 'page_count',
      row_id: body.session_id
    })

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Page view tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    )
  }
}