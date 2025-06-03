import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// This is a temporary endpoint to create admin users
// In production, this should be removed or heavily secured
export async function POST(request: NextRequest) {
  try {
    const { userId, secretKey } = await request.json()
    
    // Add a secret key check for security
    // Set this in your environment variables
    const ADMIN_CREATION_SECRET = process.env.ADMIN_CREATION_SECRET || 'your-secret-key-here'
    
    if (secretKey !== ADMIN_CREATION_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create admin user
    const { error } = await supabaseAdmin
      .from('admin_users')
      .upsert({
        user_id: userId,
        role: 'admin',
        permissions: {
          analytics: true,
          users: true,
          segments: true,
          campaigns: true
        }
      })

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Admin user created' })
  } catch (error) {
    console.error('Admin creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}