import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  Gift, LinkIcon, Share2, Users, DollarSign, Clock,
  TrendingUp, Award, Shield, CheckCircle2, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface ReferralCredit {
  id: string
  credit_amount: number
  expires_at: string
  tier_value: number
  referral_batch_count: number
}

interface ReferralStats {
  acknowledged: number
  paying: number
  uncredited_paying: number
  required: number
  progress: string
  next_credit_in: number
}

export function ReferralTracker({ user }: { user: any }) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [credits, setCredits] = useState<ReferralCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceDiscount, setServiceDiscount] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchReferralData()
  }, [user])

  const fetchReferralData = async () => {
    try {
      // Fetch referral credits and stats
      const response = await fetch('/api/referral/credits')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setCredits(data.credits)
      }

      // Check for service discount
      if (user?.service_verified) {
        setServiceDiscount({
          type: user.service_type,
          discount: 15
        })
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async (method: 'copy' | 'twitter' | 'linkedin') => {
    const referralUrl = `${window.location.origin}/referral/${user.referral_code}`
    const message = `Join me on LifeNavigator! Use my code ${user.referral_code} to jump 100 spots in the waitlist.`

    if (method === 'copy') {
      try {
        await navigator.clipboard.writeText(referralUrl)
        toast({ 
          title: "Link Copied!", 
          description: "Your referral link has been copied to clipboard." 
        })
      } catch (err) {
        toast({ 
          title: "Copy Failed", 
          description: "Could not copy to clipboard.", 
          variant: "destructive" 
        })
      }
    } else if (method === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralUrl)}`, '_blank')
    } else if (method === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, '_blank')
    }
  }

  const startServiceVerification = async () => {
    try {
      const response = await fetch('/api/verification/idme')
      if (response.ok) {
        const { authUrl } = await response.json()
        window.location.href = authUrl
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Unable to start verification process.",
        variant: "destructive"
      })
    }
  }

  if (loading) return <div>Loading referral data...</div>

  const userTypeLabel = user.user_type === 'pilot' ? 'Pilot Member' 
    : user.user_type === 'waitlist' ? 'Early Waitlist' 
    : 'Member'

  const requiredForBenefit = stats?.required || 20
  const progressPercentage = stats ? (stats.paying / requiredForBenefit) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <Card className="glassmorphic-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                Referral Program
              </CardTitle>
              <CardDescription>
                Earn free months by referring friends who become paying customers
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {userTypeLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-secondary/20">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats?.acknowledged || 0}</div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-green-500">{stats?.paying || 0}</div>
              <p className="text-sm text-muted-foreground">Paying Customers</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold gradient-text">{stats?.next_credit_in || requiredForBenefit}</div>
              <p className="text-sm text-muted-foreground">Until Next Reward</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                Progress to Next Reward
              </span>
              <span className="text-sm text-muted-foreground">
                {stats?.paying || 0} / {requiredForBenefit} paying referrals
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              As a {userTypeLabel}, you need {requiredForBenefit} paying referrals for a free month
            </p>
          </div>

          {/* Referral Link */}
          <div className="space-y-3">
            <Label>Your Referral Link</Label>
            <div className="flex items-center space-x-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/referral/${user.referral_code}`} 
                className="bg-background/50"
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleShare('copy')} className="flex-1">
                Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                <Share2 className="h-4 w-4 mr-1"/>Twitter
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                <Share2 className="h-4 w-4 mr-1"/>LinkedIn
              </Button>
            </div>
          </div>

          {/* Reward Structure */}
          <Alert className="border-primary/50 bg-primary/5">
            <Award className="h-4 w-4" />
            <AlertDescription>
              <strong>Your Reward Structure:</strong><br/>
              Every {requiredForBenefit} paying referrals = 1 month free (average tier value)<br/>
              Every {requiredForBenefit * 2} paying referrals = 1 month free at next tier up!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Active Credits */}
      {credits.length > 0 && (
        <Card className="glassmorphic-card border-green-500/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Active Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {credits.map((credit) => (
                <div key={credit.id} className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div>
                    <p className="font-semibold">${credit.credit_amount} Credit</p>
                    <p className="text-sm text-muted-foreground">
                      From {credit.referral_batch_count} referrals
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Expires {format(new Date(credit.expires_at), 'MMM d')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Member Discount */}
      <Card className="glassmorphic-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Service Member Discount
          </CardTitle>
          <CardDescription>
            Military, veterans, first responders, and teachers get 15% off for life
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serviceDiscount ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold">Verified {serviceDiscount.type.replace('_', ' ')}</p>
                  <p className="text-sm text-muted-foreground">15% lifetime discount active</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                Verified
              </Badge>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Verify your service status to receive 15% off for life. 
                  Cannot be combined with referral credits.
                </AlertDescription>
              </Alert>
              <Button onClick={startServiceVerification} className="w-full">
                Verify with ID.me
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium">{children}</label>
}