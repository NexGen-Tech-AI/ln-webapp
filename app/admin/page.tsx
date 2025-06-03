'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, Eye, MousePointer, TrendingUp, Clock, Globe, 
  Monitor, Smartphone, Tablet, ArrowUp, ArrowDown,
  UserCheck, UserX, Mail, Filter, Download
} from 'lucide-react'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'
import { UserManagement } from '@/components/admin/UserManagement'
import { SegmentBuilder } from '@/components/admin/SegmentBuilder'
import { EmailCampaigns } from '@/components/admin/EmailCampaigns'

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !adminData) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive'
        })
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await fetchStats()
    } catch (error) {
      console.error('Admin check error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch overview stats
      const [
        { count: totalUsers },
        { count: totalSessions },
        { count: totalPageViews },
        { data: conversionData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('page_views').select('*', { count: 'exact', head: true }),
        supabase.from('conversions').select('*')
      ])

      setStats({
        totalUsers: totalUsers || 0,
        totalSessions: totalSessions || 0,
        totalPageViews: totalPageViews || 0,
        conversions: conversionData?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading admin dashboard...</h1>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor analytics, manage users, and run campaigns</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="glassmorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUp className="inline h-3 w-3 text-green-500" /> 12% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUp className="inline h-3 w-3 text-green-500" /> 8% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPageViews?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowDown className="inline h-3 w-3 text-red-500" /> 3% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversions?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUp className="inline h-3 w-3 text-green-500" /> 25% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <SegmentBuilder />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <EmailCampaigns />
        </TabsContent>
      </Tabs>
    </div>
  )
}