import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
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
  totalReferrals: number
  payingReferrals: number
  waitlistReferrals: number
  potentialPayingUsers: number
  potentialRevenue: number
  tierBreakdown: {
    free: number
    pro: number
    ai: number
    family: number
  }
  rewards: {
    requiredReferrals: number
    currentBatch: number
    progressToNextReward: number
    completedBatches: number
    averageSubscriptionValue: number
    projectedRewardTier: string
    projectedRewardValue: number
    nextBatchAverageValue: number
    nextBatchProjectedTier: string
  }
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
      // Fetch referral statistics
      const token = localStorage.getItem('supabase.auth.token')
      const statsResponse = await fetch('/api/user/referral', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data.statistics)
      }

      // Fetch referral credits
      const creditsResponse = await fetch('/api/referral/credits')
      if (creditsResponse.ok) {
        const data = await creditsResponse.json()
        setCredits(data.credits || [])
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

  const getTierDisplay = (tier: string) => {
    const tierInfo = {
      free: { name: 'Free', price: '$0', color: 'text-gray-500' },
      pro: { name: 'Pro Navigator', price: '$20', color: 'text-blue-500' },
      family: { name: 'Family Navigator', price: '$35', color: 'text-purple-500' },
      ai: { name: 'AI Navigator+', price: '$99', color: 'text-green-500' }
    }
    return tierInfo[tier as keyof typeof tierInfo] || tierInfo.free
  }

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <Card className="glassmorphic-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-secondary/20">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-blue-500">{stats?.waitlistReferrals || 0}</div>
              <p className="text-sm text-muted-foreground">Waitlist Referrals</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-green-500">{stats?.payingReferrals || 0}</div>
              <p className="text-sm text-muted-foreground">Paying Customers</p>
            </div>
          </div>

          {/* Potential Revenue Section */}
          {stats && stats.potentialPayingUsers > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Potential Revenue When App Launches
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Potential Paying Users</p>
                  <p className="text-xl font-bold text-purple-500">{stats.potentialPayingUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potential Monthly Revenue</p>
                  <p className="text-xl font-bold text-green-500">${stats.potentialRevenue}/mo</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-2">Tier Preferences:</p>
                <div className="flex gap-2 flex-wrap">
                  {stats.tierBreakdown.pro > 0 && (
                    <Badge variant="outline" className="text-xs">Pro: {stats.tierBreakdown.pro}</Badge>
                  )}
                  {stats.tierBreakdown.ai > 0 && (
                    <Badge variant="outline" className="text-xs">AI+: {stats.tierBreakdown.ai}</Badge>
                  )}
                  {stats.tierBreakdown.family > 0 && (
                    <Badge variant="outline" className="text-xs">Family: {stats.tierBreakdown.family}</Badge>
                  )}
                  {stats.tierBreakdown.free > 0 && (
                    <Badge variant="outline" className="text-xs">Free: {stats.tierBreakdown.free}</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {stats && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    Progress to Next Free Month
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {stats.rewards.currentBatch} / {stats.rewards.requiredReferrals} paying referrals
                  </span>
                </div>
                <Progress value={stats.rewards.progressToNextReward} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  As a {userTypeLabel}, you need {stats.rewards.requiredReferrals} paying referrals for each free month
                </p>
              </div>
              
              {/* Reward Tier Information */}
              {stats.rewards.currentBatch > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-5 w-5 text-indigo-500" />
                    Your Next Free Month Reward
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Based on Average Tier</p>
                      <p className={`text-lg font-bold ${getTierDisplay(stats.rewards.nextBatchProjectedTier).color}`}>
                        {getTierDisplay(stats.rewards.nextBatchProjectedTier).name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Worth {getTierDisplay(stats.rewards.nextBatchProjectedTier).price}/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Value</p>
                      <p className="text-lg font-bold text-green-500">
                        ${stats.rewards.nextBatchAverageValue.toFixed(2)}/mo
                      </p>
                      <p className="text-sm text-muted-foreground">
                        From current batch
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Completed Batches */}
              {stats.rewards.completedBatches > 0 && (
                <Alert className="border-green-500/50 bg-green-500/5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <strong>Congratulations!</strong> You've earned {stats.rewards.completedBatches} free month{stats.rewards.completedBatches > 1 ? 's' : ''} 
                    with an average tier value of ${stats.rewards.averageSubscriptionValue.toFixed(2)}/mo
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Referral Link */}
          <div className="space-y-3">
            <Label>Your Referral Link</Label>
            <div className="flex items-center space-x-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/referral/${user.referral_code}`} 
                className="bg-background/50 text-xs sm:text-sm truncate"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={() => handleShare('copy')} className="flex-1">
                Copy Link
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShare('twitter')} className="flex-1">
                  <Share2 className="h-4 w-4 mr-1"/><span className="hidden sm:inline">Twitter</span><span className="sm:hidden">X</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')} className="flex-1">
                  <Share2 className="h-4 w-4 mr-1"/><span className="hidden sm:inline">LinkedIn</span><span className="sm:hidden">LI</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Reward Structure */}
          {stats && (
            <Alert className="border-primary/50 bg-primary/5">
              <Award className="h-4 w-4" />
              <AlertDescription>
                <strong>Your Reward Structure:</strong><br/>
                Every {stats.rewards.requiredReferrals} paying referrals = 1 month free<br/>
                Your reward tier is based on the average subscription value of your referrals<br/>
                Higher tier referrals = Higher tier rewards!
              </AlertDescription>
            </Alert>
          )}
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

