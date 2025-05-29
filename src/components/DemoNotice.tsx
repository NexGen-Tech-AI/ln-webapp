'use client'

import { isSupabaseConfigured } from '@/lib/supabase'
import { AlertCircle } from 'lucide-react'

export function DemoNotice() {
  if (isSupabaseConfigured) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-md p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg shadow-lg z-50">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-yellow-500">Demo Mode</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Supabase is not configured. Authentication and data persistence are disabled.
            To enable full functionality, add your Supabase credentials to .env.local
          </p>
        </div>
      </div>
    </div>
  )
}