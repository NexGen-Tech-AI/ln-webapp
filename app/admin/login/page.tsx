'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { Shield, Lock, AlertTriangle } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // First, attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        // Check if MFA is required
        if (signInError.message.includes('MFA')) {
          setShowOtp(true)
          setLoading(false)
          return
        }
        throw signInError
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', data.user?.id)
        .single()

      if (adminError || !adminData) {
        await supabase.auth.signOut()
        throw new Error('You do not have admin access')
      }

      // Log successful admin login
      await fetch('/api/admin/security-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user?.id,
          action: 'admin_login',
          ip: 'client'
        })
      })

      toast({
        title: 'Welcome back!',
        description: 'Redirecting to admin dashboard...'
      })

      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Failed to login')
      
      // Log failed attempt
      if (email) {
        await fetch('/api/admin/security-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'unknown',
            action: 'failed_admin_login',
            details: { email },
            ip: 'client'
          })
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'magiclink'
      })

      if (error) throw error

      toast({
        title: 'MFA verified!',
        description: 'Redirecting to admin dashboard...'
      })

      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glassmorphic-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>
            This area is restricted to authorized administrators only
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showOtp ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lifenavigator.com"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="text-xs text-yellow-500">
                    <p className="font-semibold">Security Notice:</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>This login is monitored and logged</li>
                      <li>Unauthorized access attempts will be reported</li>
                      <li>IP address restrictions may apply</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Login to Admin'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter MFA Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Check your email or authenticator app for the code
                </p>
              </div>

              {error && (
                <Alert className="border-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify MFA'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowOtp(false)
                  setOtp('')
                  setError('')
                }}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}