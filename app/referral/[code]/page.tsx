'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

export default function ReferralPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const referralCode = params.code

  useEffect(() => {
    // Store the referral code in localStorage
    if (referralCode && referralCode.startsWith('NAV-')) {
      localStorage.setItem('referralCode', referralCode)
      
      toast({
        title: 'Referral code applied! 🎉',
        description: `You'll jump 100 spots when you sign up with code ${referralCode}`,
        duration: 5000,
      })
      
      // Redirect to signup page
      setTimeout(() => {
        router.push('/signup')
      }, 2000)
    } else {
      toast({
        title: 'Invalid referral code',
        description: 'This referral link appears to be invalid.',
        variant: 'destructive',
      })
      
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }, [referralCode, router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Applying referral code...</h1>
        <p className="text-muted-foreground">Redirecting to signup page...</p>
      </div>
    </div>
  )
}