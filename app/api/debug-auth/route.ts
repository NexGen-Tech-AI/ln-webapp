import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET() {
  try {
    // Check if we can connect to Supabase
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    // Check if users table exists and has data
    const { data: dbUsers, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at')
      .limit(5)
      .order('created_at', { ascending: false })
    
    // Check if sequence exists
    const { data: sequenceCheck, error: seqError } = await supabaseAdmin
      .from('pg_sequences')
      .select('*')
      .eq('schemaname', 'public')
      .eq('sequencename', 'users_position_seq')
      .single()
    
    return NextResponse.json({
      status: 'ok',
      auth: {
        connected: !authError,
        userCount: authUsers?.users?.length || 0,
        error: authError?.message
      },
      database: {
        connected: !dbError,
        recentUsers: dbUsers || [],
        error: dbError?.message
      },
      sequence: {
        exists: !!sequenceCheck,
        error: seqError?.message
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Test signup
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    // Try to create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm for testing
    })
    
    if (authError) {
      return NextResponse.json({
        success: false,
        step: 'auth_creation',
        error: authError.message,
        code: authError.status
      }, { status: 400 })
    }
    
    // Try to create user profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user!.id,
        email: authData.user!.email,
        name: 'Test User',
        profession: 'Developer',
        company: 'Test Co',
        interests: ['testing'],
        tier_preference: 'free'
      })
      .select()
      .single()
    
    if (profileError) {
      // Clean up auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id)
      
      return NextResponse.json({
        success: false,
        step: 'profile_creation',
        error: profileError.message,
        details: profileError
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      user: profileData,
      authId: authData.user!.id
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      step: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}