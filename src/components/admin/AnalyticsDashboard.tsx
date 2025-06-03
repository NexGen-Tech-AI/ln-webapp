'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { Download, Calendar, Globe, Monitor, Clock } from 'lucide-react'

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    pageViews: [],
    topPages: [],
    trafficSources: [],
    devices: [],
    formFunnel: [],
    sessionDurations: []
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = timeRange === '7d' 
        ? subDays(endDate, 7)
        : timeRange === '30d'
        ? subDays(endDate, 30)
        : subDays(endDate, 90)

      // Fetch page views over time
      const { data: pageViewsData } = await supabase
        .from('page_views')
        .select('created_at, page_path')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at')

      // Process page views by day
      const pageViewsByDay = processPageViewsByDay(pageViewsData || [])

      // Fetch top pages
      const { data: topPagesData } = await supabase
        .from('page_views')
        .select('page_path')
        .gte('created_at', startDate.toISOString())

      const topPages = processTopPages(topPagesData || [])

      // Fetch traffic sources
      const { data: trafficData } = await supabase
        .from('page_views')
        .select('referrer_source')
        .gte('created_at', startDate.toISOString())

      const trafficSources = processTrafficSources(trafficData || [])

      // Fetch device types
      const { data: deviceData } = await supabase
        .from('user_sessions')
        .select('device_type')
        .gte('started_at', startDate.toISOString())

      const devices = processDeviceTypes(deviceData || [])

      // Fetch form funnel data
      const { data: formData } = await supabase
        .from('form_analytics')
        .select('*')
        .eq('form_name', 'signup')
        .gte('created_at', startDate.toISOString())

      const formFunnel = processFormFunnel(formData || [])

      // Fetch session durations
      const { data: sessionData } = await supabase
        .from('user_sessions')
        .select('total_duration_seconds')
        .gte('started_at', startDate.toISOString())
        .not('total_duration_seconds', 'is', null)

      const sessionDurations = processSessionDurations(sessionData || [])

      setData({
        pageViews: pageViewsByDay,
        topPages,
        trafficSources,
        devices,
        formFunnel,
        sessionDurations
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processPageViewsByDay = (data: any[]) => {
    const grouped = data.reduce((acc, view) => {
      const day = format(new Date(view.created_at), 'MMM dd')
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {})

    return Object.entries(grouped).map(([date, views]) => ({ date, views }))
  }

  const processTopPages = (data: any[]) => {
    const counts = data.reduce((acc, view) => {
      acc[view.page_path] = (acc[view.page_path] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([page, views]) => ({ page, views }))
  }

  const processTrafficSources = (data: any[]) => {
    const counts = data.reduce((acc, view) => {
      const source = view.referrer_source || 'direct'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([source, count]) => ({ 
      name: source, 
      value: count 
    }))
  }

  const processDeviceTypes = (data: any[]) => {
    const counts = data.reduce((acc, session) => {
      const device = session.device_type || 'unknown'
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([device, count]) => ({ 
      name: device, 
      value: count 
    }))
  }

  const processFormFunnel = (data: any[]) => {
    const total = data.length
    if (total === 0) return []

    const steps = [
      { name: 'Started', value: total },
      { name: 'Step 2', value: data.filter(f => f.step_reached >= 2).length },
      { name: 'Step 3', value: data.filter(f => f.step_reached >= 3).length },
      { name: 'Step 4', value: data.filter(f => f.step_reached >= 4).length },
      { name: 'Step 5', value: data.filter(f => f.step_reached >= 5).length },
      { name: 'Completed', value: data.filter(f => f.completed).length }
    ]

    return steps.map(step => ({
      ...step,
      percentage: ((step.value / total) * 100).toFixed(1)
    }))
  }

  const processSessionDurations = (data: any[]) => {
    const buckets = {
      '0-30s': 0,
      '30s-2m': 0,
      '2-5m': 0,
      '5-10m': 0,
      '10m+': 0
    }

    data.forEach(session => {
      const seconds = session.total_duration_seconds
      if (seconds <= 30) buckets['0-30s']++
      else if (seconds <= 120) buckets['30s-2m']++
      else if (seconds <= 300) buckets['2-5m']++
      else if (seconds <= 600) buckets['5-10m']++
      else buckets['10m+']++
    })

    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count
    }))
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

  const exportData = () => {
    const csv = convertToCSV(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const convertToCSV = (data: any) => {
    // Implement CSV conversion logic
    return 'Page Views Data\\n' + JSON.stringify(data.pageViews)
  }

  if (loading) {
    return <div>Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Page Views Chart */}
      <Card className="glassmorphic-card">
        <CardHeader>
          <CardTitle>Page Views Over Time</CardTitle>
          <CardDescription>Daily page views for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.pageViews}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card className="glassmorphic-card">
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topPages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="page" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="glassmorphic-card">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.trafficSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.trafficSources.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Types */}
        <Card className="glassmorphic-card">
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
            <CardDescription>Devices used to access the site</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.devices}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.devices.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Form Funnel */}
        <Card className="glassmorphic-card">
          <CardHeader>
            <CardTitle>Signup Funnel</CardTitle>
            <CardDescription>User progression through signup</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.formFunnel} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Session Duration Distribution */}
      <Card className="glassmorphic-card">
        <CardHeader>
          <CardTitle>Session Duration Distribution</CardTitle>
          <CardDescription>How long users stay on the site</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.sessionDurations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}