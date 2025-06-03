import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log security events
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: body.user_id,
        action: body.action,
        details: {
          path: body.path,
          ip: body.ip,
          timestamp: new Date().toISOString()
        },
        ip_address: body.ip,
        user_agent: request.headers.get('user-agent')
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Security log error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}