'use client'

import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState({
    supabaseConfigured: false,
    authLoading: true,
    user: null,
    error: null,
    envVars: {
      hasSupabaseUrl: false,
      hasSupabaseKey: false,
    }
  })
  
  const auth = useAuth()

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const info: any = {
          supabaseConfigured: isSupabaseConfigured,
          authLoading: auth.isLoading,
          user: auth.user,
          error: null,
          envVars: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          }
        }
        
        // Test Supabase connection
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.auth.getSession()
          if (error) {
            info.error = error.message
          }
        }
        
        setDebugInfo(info)
      } catch (err) {
        setDebugInfo(prev => ({ ...prev, error: err instanceof Error ? err.message : String(err) }))
      }
    }
    
    checkEnvironment()
  }, [auth.isLoading, auth.user])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-semibold mb-2">Environment Status</h2>
          <ul className="space-y-1">
            <li>Supabase Configured: {debugInfo.supabaseConfigured ? '✅ Yes' : '❌ No'}</li>
            <li>Has SUPABASE_URL: {debugInfo.envVars.hasSupabaseUrl ? '✅ Yes' : '❌ No'}</li>
            <li>Has SUPABASE_ANON_KEY: {debugInfo.envVars.hasSupabaseKey ? '✅ Yes' : '❌ No'}</li>
          </ul>
        </div>
        
        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-semibold mb-2">Auth Context Status</h2>
          <ul className="space-y-1">
            <li>Loading: {debugInfo.authLoading ? '⏳ Yes' : '✅ No'}</li>
            <li>User: {debugInfo.user ? `✅ ${JSON.stringify(debugInfo.user)}` : '❌ No user'}</li>
          </ul>
        </div>
        
        {debugInfo.error && (
          <div className="p-4 bg-red-900 rounded">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{debugInfo.error}</p>
          </div>
        )}
        
        <div className="p-4 bg-blue-900 rounded">
          <h2 className="text-xl font-semibold mb-2">Page Status</h2>
          <p>If you can see this page, React is rendering correctly.</p>
          <p>The issue is likely in the main page components.</p>
        </div>
      </div>
      
      <div className="mt-8">
        <a href="/" className="text-blue-400 hover:underline">← Back to Home</a>
      </div>
    </div>
  )
}