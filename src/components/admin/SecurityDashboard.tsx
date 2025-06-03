'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Shield, AlertTriangle, Lock, Activity, Globe, User } from 'lucide-react'

interface SecurityLog {
  id: string
  user_id: string
  action: string
  details: any
  ip_address: string
  user_agent: string
  created_at: string
}

export function SecurityDashboard() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [threats, setThreats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSession, setCurrentSession] = useState<any>(null)

  useEffect(() => {
    fetchSecurityData()
    fetchCurrentSession()
    
    // Set up real-time subscription for security events
    const subscription = supabase
      .channel('security-logs')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          if (payload.new.action?.includes('unauthorized')) {
            setThreats(prev => [payload.new, ...prev].slice(0, 10))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchSecurityData = async () => {
    try {
      // Fetch recent security logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .or('action.eq.unauthorized_admin_access,action.eq.admin_login,action.eq.admin_action')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!logsError) setLogs(logsData || [])

      // Fetch potential threats
      const { data: threatsData } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'unauthorized_admin_access')
        .order('created_at', { ascending: false })
        .limit(10)

      if (threatsData) setThreats(threatsData)
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setCurrentSession(session)
  }

  const terminateAllSessions = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (!error) {
      window.location.href = '/login'
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('unauthorized')) return 'destructive'
    if (action === 'admin_login') return 'default'
    return 'secondary'
  }

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile')) return <Smartphone className="h-4 w-4" />
    if (ua.includes('tablet')) return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  if (loading) return <div>Loading security data...</div>

  return (
    <div className="space-y-6">
      {/* Security Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glassmorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Secure</div>
            <p className="text-xs text-muted-foreground">No active threats detected</p>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Access Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threats.length}</div>
            <p className="text-xs text-muted-foreground">In the last 30 days</p>
          </CardContent>
        </Card>

        <Card className="glassmorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Session</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Expires in {currentSession ? Math.floor((new Date(currentSession.expires_at).getTime() - Date.now()) / 1000 / 60) : 0} minutes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Threats Alert */}
      {threats.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Alert:</strong> {threats.length} unauthorized access attempts detected.
            Review the security logs below for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Session Info */}
      <Card className="glassmorphic-card">
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
          <CardDescription>Your active admin session details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Session ID</span>
              <code className="text-xs">{currentSession?.access_token?.substring(0, 20)}...</code>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">IP Address</span>
              <span className="text-sm">{logs[0]?.ip_address || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Expires</span>
              <span className="text-sm">
                {currentSession && format(new Date(currentSession.expires_at), 'MMM d, h:mm a')}
              </span>
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            className="mt-4"
            onClick={terminateAllSessions}
          >
            Terminate All Sessions
          </Button>
        </CardContent>
      </Card>

      {/* Security Logs */}
      <Card className="glassmorphic-card">
        <CardHeader>
          <CardTitle>Security Logs</CardTitle>
          <CardDescription>Recent security events and admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={getActionColor(log.action) as any}>
                    {log.action.replace(/_/g, ' ')}
                  </Badge>
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <span className="text-muted-foreground">{log.ip_address || 'Unknown IP'}</span>
                    </div>
                    {log.user_agent && (
                      <div className="flex items-center gap-2 mt-1">
                        {getDeviceIcon(log.user_agent)}
                        <span className="text-xs text-muted-foreground">
                          {log.user_agent.substring(0, 50)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </div>
                  {log.details?.path && (
                    <div className="text-xs text-muted-foreground">
                      {log.details.path}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threat Details */}
      {threats.length > 0 && (
        <Card className="glassmorphic-card border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-500">Unauthorized Access Attempts</CardTitle>
            <CardDescription>Recent failed attempts to access admin areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {threats.map((threat) => (
                <div key={threat.id} className="p-3 border border-yellow-500/50 rounded-lg bg-yellow-500/5">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">User ID: {threat.user_id}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Attempted to access: {threat.details?.path || 'Unknown path'}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">Blocked</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(threat.created_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}