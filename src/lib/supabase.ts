import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if we have real credentials
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.'))

// Create a mock client for development without credentials
const createMockClient = (): SupabaseClient<Database> => {
  const mockClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } }
      }),
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
      refreshSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: new Error('Supabase not configured') }),
          execute: async () => ({ data: [], error: new Error('Supabase not configured') })
        }),
        single: async () => ({ data: null, error: new Error('Supabase not configured') })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: new Error('Supabase not configured') })
        }),
        execute: async () => ({ data: null, error: new Error('Supabase not configured') })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: new Error('Supabase not configured') })
          })
        })
      }),
      delete: () => ({
        eq: () => ({
          execute: async () => ({ data: null, error: new Error('Supabase not configured') })
        })
      })
    }),
    rpc: async () => ({ data: null, error: new Error('Supabase not configured') })
  } as any
  
  return mockClient
}

// Client-side Supabase client
export const supabase: SupabaseClient<Database> = isSupabaseConfigured && supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createMockClient()

// Server-side Supabase client with service role key (for admin operations)
export const supabaseAdmin: SupabaseClient<Database> = isSupabaseConfigured && supabaseUrl && supabaseServiceRoleKey
  ? createClient<Database>(
      supabaseUrl, 
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : createMockClient()