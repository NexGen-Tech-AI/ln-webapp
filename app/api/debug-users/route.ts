import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get recent users from public.users
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Get recent auth users to compare
    const { data: authResponse, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 5
    })
    
    // Check for metadata in auth users
    const authUsers = authResponse?.users?.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      metadata: user.user_metadata,
      raw_metadata: user.raw_user_meta_data
    }))
    
    return NextResponse.json({
      publicUsers: publicUsers || [],
      publicError: publicError?.message,
      authUsers: authUsers || [],
      authError: authError?.message,
      comparison: publicUsers?.map(pu => {
        const au = authUsers?.find(a => a.id === pu.id)
        return {
          email: pu.email,
          has_name: !!pu.name,
          has_profession: !!pu.profession,
          has_company: !!pu.company,
          has_interests: !!pu.interests && pu.interests.length > 0,
          auth_has_metadata: !!au?.metadata && Object.keys(au.metadata).length > 0
        }
      })
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}