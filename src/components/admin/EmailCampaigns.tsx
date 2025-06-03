'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Mail, Send, Clock, Users, Eye, MousePointer } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

interface Campaign {
  id: string
  name: string
  subject: string
  segment_id: string
  status: string
  sent_count: number
  open_count: number
  click_count: number
  scheduled_for?: string
  sent_at?: string
  created_at: string
}

interface Segment {
  id: string
  name: string
  user_count: number
}

export function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [creating, setCreating] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content_html: '',
    segment_id: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchCampaigns()
    fetchSegments()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_segments')
        .select('id, name, user_count')
        .eq('is_active', true)

      if (error) throw error
      setSegments(data || [])
    } catch (error) {
      console.error('Error fetching segments:', error)
    }
  }

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.content_html || !newCampaign.segment_id) {
      toast({
        title: 'Invalid campaign',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('email_campaigns')
        .insert({
          ...newCampaign,
          status: 'draft'
        })

      if (error) throw error

      toast({
        title: 'Campaign created',
        description: 'Your email campaign has been created as a draft'
      })

      setNewCampaign({ name: '', subject: '', content_html: '', segment_id: '' })
      setCreating(false)
      fetchCampaigns()
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive'
      })
    }
  }

  const sendCampaign = async (campaignId: string) => {
    try {
      // TODO: Implement actual email sending logic
      const { error } = await supabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      if (error) throw error

      toast({
        title: 'Campaign sent',
        description: 'Your email campaign has been sent successfully'
      })

      fetchCampaigns()
    } catch (error) {
      console.error('Error sending campaign:', error)
      toast({
        title: 'Error',
        description: 'Failed to send campaign',
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'scheduled': return 'default'
      case 'sending': return 'warning'
      case 'sent': return 'success'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Campaign List */}
      <Card className="glassmorphic-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>Create and manage email campaigns</CardDescription>
            </div>
            <Button onClick={() => setCreating(true)} disabled={creating}>
              <Mail className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">Subject: {campaign.subject}</p>
                    <div className="flex gap-4 mt-2">
                      <Badge variant={getStatusColor(campaign.status) as any}>
                        {campaign.status}
                      </Badge>
                      {campaign.sent_count > 0 && (
                        <>
                          <span className="text-sm text-muted-foreground">
                            <Send className="inline h-3 w-3 mr-1" />
                            {campaign.sent_count} sent
                          </span>
                          <span className="text-sm text-muted-foreground">
                            <Eye className="inline h-3 w-3 mr-1" />
                            {campaign.open_count} opens ({((campaign.open_count / campaign.sent_count) * 100).toFixed(1)}%)
                          </span>
                          <span className="text-sm text-muted-foreground">
                            <MousePointer className="inline h-3 w-3 mr-1" />
                            {campaign.click_count} clicks ({((campaign.click_count / campaign.sent_count) * 100).toFixed(1)}%)
                          </span>
                        </>
                      )}
                    </div>
                    {campaign.sent_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sent {format(new Date(campaign.sent_at), 'MMM d, yyyy at h:mm a')}
                      </p>
                    )}
                  </div>
                  {campaign.status === 'draft' && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => sendCampaign(campaign.id)}>
                        Send Now
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Campaign Form */}
      {creating && (
        <Card className="glassmorphic-card">
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Design and send an email campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., Weekly Newsletter"
                />
              </div>
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                  placeholder="e.g., Your LifeNavigator Weekly Update"
                />
              </div>
              <div>
                <Label htmlFor="segment">Target Segment</Label>
                <Select
                  value={newCampaign.segment_id}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, segment_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.map(segment => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.user_count} users)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Email Content (HTML)</Label>
                <Textarea
                  id="content"
                  value={newCampaign.content_html}
                  onChange={(e) => setNewCampaign({ ...newCampaign, content_html: e.target.value })}
                  placeholder="Enter your email HTML content..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createCampaign}>
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}