'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (analytics) {
      // Track page view
      analytics.trackPageView({
        page_path: pathname,
        page_title: document.title
      })

      // Track signup form on signup page
      if (pathname === '/signup') {
        analytics.trackFormStart('signup', 5)
      }
    }
  }, [pathname])

  // Set up first visit timestamp
  useEffect(() => {
    if (!localStorage.getItem('first_visit')) {
      localStorage.setItem('first_visit', Date.now().toString())
    }
  }, [])

  return <>{children}</>
}