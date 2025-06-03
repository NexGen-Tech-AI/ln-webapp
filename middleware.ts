import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Define protected admin routes
const ADMIN_ROUTES = ['/admin', '/api/analytics', '/api/admin']

// IP Whitelist (add your IPs here)
const ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || []

// Admin user IDs (more secure than checking in database every time)
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || []

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const pathname = req.nextUrl.pathname

  // Check if this is an admin route
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
  
  if (isAdminRoute) {
    // 1. Check IP whitelist if enabled
    if (ALLOWED_IPS.length > 0) {
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
      
      if (!ALLOWED_IPS.includes(clientIp)) {
        console.warn(`Unauthorized admin access attempt from IP: ${clientIp}`)
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // 2. Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // Redirect to login for web pages, return 401 for API
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // 3. Check if user is admin (using environment variable for security)
    if (!ADMIN_USER_IDS.includes(session.user.id)) {
      console.warn(`Unauthorized admin access attempt by user: ${session.user.id}`)
      
      // Log this security event
      try {
        await fetch(`${req.nextUrl.origin}/api/admin/security-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: session.user.id,
            action: 'unauthorized_admin_access',
            path: pathname,
            ip: req.headers.get('x-forwarded-for') || 'unknown'
          })
        })
      } catch (error) {
        console.error('Failed to log security event:', error)
      }

      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // 4. Add security headers
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/analytics/:path*',
    '/api/admin/:path*'
  ]
}