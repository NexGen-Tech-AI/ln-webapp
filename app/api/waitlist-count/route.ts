import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with anon key for public access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Get the count from the public view
    const { data, error } = await supabase
      .from('waitlist_count')
      .select('total_users')
      .single()
    
    if (error) {
      // Fallback to direct count if view doesn't exist
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      return NextResponse.json({ 
        count: count || 100 
      })
    }
    
    return NextResponse.json({ 
      count: data?.total_users || 100 
    })
  } catch (error) {
    console.error('Error fetching waitlist count:', error)
    return NextResponse.json({ count: 100 })
  }
}

// Enable caching for 1 minute
export const revalidate = 60