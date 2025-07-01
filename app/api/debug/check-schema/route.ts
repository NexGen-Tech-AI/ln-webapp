import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client
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

export async function GET(request: NextRequest) {
  try {
    // Get column information for users table
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .order('ordinal_position')

    if (columnsError) {
      console.error('Error fetching columns:', columnsError)
    }

    // Get a sample user to see what data is actually stored
    const { data: sampleUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    // Check if required columns exist
    const requiredColumns = ['name', 'profession', 'company', 'interests', 'tier_preference', 'position', 'referral_code', 'user_type']
    const existingColumns = columns?.map(col => col.column_name) || []
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

    return NextResponse.json({
      schema: {
        columns: columns || [],
        missingRequiredColumns: missingColumns,
        totalColumns: columns?.length || 0
      },
      sampleData: {
        users: sampleUsers || [],
        count: sampleUsers?.length || 0
      },
      debug: {
        hasNameColumn: existingColumns.includes('name'),
        hasProfessionColumn: existingColumns.includes('profession'),
        hasCompanyColumn: existingColumns.includes('company'),
        hasInterestsColumn: existingColumns.includes('interests'),
        hasTierPreferenceColumn: existingColumns.includes('tier_preference')
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}