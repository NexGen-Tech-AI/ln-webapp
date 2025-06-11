'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { Toaster } from '@/components/ui/toaster'
import { DemoNotice } from '@/components/DemoNotice'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
      <Toaster />
      {/* <DemoNotice /> */}
    </AuthProvider>
  )
}