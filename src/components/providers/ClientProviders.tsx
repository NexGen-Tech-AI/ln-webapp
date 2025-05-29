'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { DemoNotice } from '@/components/DemoNotice'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
      <DemoNotice />
    </AuthProvider>
  )
}