import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headersList = headers()
    
    // Get IP address
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

    // Parse user agent for browser and OS info
    const userAgent = body.user_agent || ''
    const browserInfo = parseBrowser(userAgent)
    const osInfo = parseOS(userAgent)

    // Try to get location from IP (you can integrate with a geolocation API)
    const location = await getLocationFromIP(ip)

    const sessionData: any = {
      id: body.session_id,
      visitor_id: body.visitor_id,
      ip_address: ip !== 'unknown' ? ip : null,
      user_agent: userAgent,
      browser: browserInfo.name,
      browser_version: browserInfo.version,
      os: osInfo.name,
      os_version: osInfo.version,
      device_type: body.device_type,
      country: location?.country,
      region: location?.region,
      city: location?.city,
      timezone: location?.timezone,
      language: body.language,
      screen_resolution: body.screen_resolution,
      viewport_size: body.viewport_size,
      entry_page: body.entry_page,
      is_returning_visitor: body.is_returning_visitor
    }

    // Get authenticated user if available
    const authHeader = headersList.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) {
        sessionData.user_id = user.id
      }
    }

    const { error } = await supabaseAdmin
      .from('user_sessions')
      .insert(sessionData)

    if (error) throw error

    return NextResponse.json({ success: true, session_id: body.session_id })
  } catch (error) {
    console.error('Analytics session error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sessionId = url.pathname.split('/').pop()
    const body = await request.json()

    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({
        exit_page: body.exit_page,
        ended_at: new Date().toISOString(),
        page_count: body.page_count
      })
      .eq('id', sessionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

function parseBrowser(ua: string): { name: string; version: string } {
  let name = 'Unknown'
  let version = ''

  if (ua.includes('Chrome')) {
    name = 'Chrome'
    const match = ua.match(/Chrome\/(\d+)/)
    version = match ? match[1] : ''
  } else if (ua.includes('Safari')) {
    name = 'Safari'
    const match = ua.match(/Version\/(\d+)/)
    version = match ? match[1] : ''
  } else if (ua.includes('Firefox')) {
    name = 'Firefox'
    const match = ua.match(/Firefox\/(\d+)/)
    version = match ? match[1] : ''
  }

  return { name, version }
}

function parseOS(ua: string): { name: string; version: string } {
  let name = 'Unknown'
  let version = ''

  if (ua.includes('Windows')) {
    name = 'Windows'
    if (ua.includes('Windows NT 10')) version = '10'
    else if (ua.includes('Windows NT 6.3')) version = '8.1'
  } else if (ua.includes('Mac OS X')) {
    name = 'macOS'
    const match = ua.match(/Mac OS X (\d+[._]\d+)/)
    version = match ? match[1].replace('_', '.') : ''
  } else if (ua.includes('Android')) {
    name = 'Android'
    const match = ua.match(/Android (\d+\.\d+)/)
    version = match ? match[1] : ''
  } else if (ua.includes('iPhone OS')) {
    name = 'iOS'
    const match = ua.match(/iPhone OS (\d+_\d+)/)
    version = match ? match[1].replace('_', '.') : ''
  }

  return { name, version }
}

async function getLocationFromIP(ip: string): Promise<any> {
  // For now, return null. You can integrate with services like:
  // - ipapi.co
  // - ipinfo.io
  // - MaxMind GeoIP
  return null
}