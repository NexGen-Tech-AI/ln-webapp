import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, secretKey } = body

    // Verify the secret key
    if (secretKey !== process.env.ADMIN_CREATION_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      )
    }

    // Verify user ID is in allowed list
    const allowedUserIds = process.env.ADMIN_USER_IDS?.split(',') || []
    if (!allowedUserIds.includes(userId)) {
      return NextResponse.json(
        { error: 'User ID not in allowed list' },
        { status: 403 }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Admin user already exists' },
        { status: 200 }
      )
    }

    // Create admin user
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .insert({
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin:', error)
      return NextResponse.json(
        { error: 'Failed to create admin user' },
        { status: 500 }
      )
    }

    // Log the admin creation
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'admin_created',
        details: { created_by: 'setup_script' },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      message: 'Admin user created successfully',
      data
    })
  } catch (error) {
    console.error('Admin creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}