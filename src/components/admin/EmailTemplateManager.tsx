'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Send,
  Eye,
  Save,
  Users,
  Mail,
  Sparkles,
  Megaphone,
  Trophy,
  Code,
  Image,
  FileText,
  Calendar,
  CheckCircle2
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'feature' | 'announcement' | 'milestone' | 'custom'
  tags: string[]
  lastModified: Date
}

export function EmailTemplateManager() {
  const { toast } = useToast()
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Form states
  const [emailType, setEmailType] = useState<'feature' | 'announcement' | 'milestone' | 'custom'>('announcement')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [targetSegment, setTargetSegment] = useState('all')
  const [scheduledTime, setScheduledTime] = useState('')

  // Pre-built templates
  const templates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Feature Launch',
      subject: '✨ New Feature: {feature_name}',
      content: `<h3>Introducing {feature_name}!</h3>
<p>We're excited to announce a new feature that will help you {benefit}.</p>
<h4>What's New:</h4>
<ul>
  <li>{feature_1}</li>
  <li>{feature_2}</li>
  <li>{feature_3}</li>
</ul>
<p>This feature is now available in your dashboard. Give it a try and let us know what you think!</p>`,
      type: 'feature',
      tags: ['product', 'launch'],
      lastModified: new Date()
    },
    {
      id: '2',
      name: 'Milestone Celebration',
      subject: '🎉 We have reached {milestone}!',
      content: `<h3>Amazing News!</h3>
<p>Thanks to your support, we've just hit an incredible milestone: <strong>{milestone}</strong>!</p>
<p>This wouldn't have been possible without our amazing community. As a token of our appreciation, we're {reward}.</p>
<p>Here's to many more milestones together! 🚀</p>`,
      type: 'milestone',
      tags: ['community', 'celebration'],
      lastModified: new Date()
    },
    {
      id: '3',
      name: 'Product Update',
      subject: '📢 LifeNav Update: {month} {year}',
      content: `<h3>Your {month} Update</h3>
<p>Here's what we've been working on this month:</p>
<h4>🚀 New Features</h4>
<p>{new_features}</p>
<h4>🛠️ Improvements</h4>
<p>{improvements}</p>
<h4>🐛 Bug Fixes</h4>
<p>{bug_fixes}</p>
<p>As always, we love hearing from you. Reply to this email with any feedback!</p>`,
      type: 'announcement',
      tags: ['update', 'monthly'],
      lastModified: new Date()
    }
  ]

  const handleSendEmail = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          subject,
          content,
          ctaText,
          ctaUrl,
          segment: targetSegment,
          scheduledFor: scheduledTime || null
        })
      })

      if (!response.ok) throw new Error('Failed to send email')

      toast({
        title: "Email campaign created!",
        description: scheduledTime ? "Your email has been scheduled." : "Your email is being sent.",
      })

      // Reset form
      setSubject('')
      setContent('')
      setCtaText('')
      setCtaUrl('')
      setScheduledTime('')
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const loadTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setSubject(template.subject)
    setContent(template.content)
    setEmailType(template.type)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Sparkles className="h-4 w-4" />
      case 'announcement': return <Megaphone className="h-4 w-4" />
      case 'milestone': return <Trophy className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Campaign Manager</CardTitle>
          <CardDescription>
            Create beautiful emails with our template system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="compose" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Type</Label>
                    <Select value={emailType} onValueChange={(v: any) => setEmailType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            Feature Launch
                          </div>
                        </SelectItem>
                        <SelectItem value="announcement">
                          <div className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-blue-500" />
                            Announcement
                          </div>
                        </SelectItem>
                        <SelectItem value="milestone">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            Milestone
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            Custom
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Segment</Label>
                    <Select value={targetSegment} onValueChange={setTargetSegment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="pilot">Pilot Users</SelectItem>
                        <SelectItem value="waitlist">Waitlist Users</SelectItem>
                        <SelectItem value="verified">Verified Service Members</SelectItem>
                        <SelectItem value="active">Active Users (Last 30 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Content</Label>
                  <div className="border rounded-lg p-2 space-y-2">
                    <div className="flex gap-2 border-b pb-2">
                      <Button size="sm" variant="ghost">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Code className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter your email content... (HTML supported)"
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pro tip: Use variables like {'{user_name}'}, {'{referral_count}'}, {'{position}'} for personalization
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA Button Text (Optional)</Label>
                    <Input
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g., Get Started"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA URL (Optional)</Label>
                    <Input
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://lifenav.ai/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Schedule Send (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(true)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendEmail} 
                    disabled={!subject || !content || sending}
                  >
                    {sending ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {scheduledTime ? 'Schedule' : 'Send Now'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => loadTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(template.type)}
                            <h3 className="font-semibold">{template.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.subject}</p>
                          <div className="flex gap-2 mt-2">
                            {template.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Email Preview</CardTitle>
                  <CardDescription>
                    See how your email will look in different clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                      <div className="mb-4 text-sm text-gray-500">
                        From: LifeNav &lt;updates@lifenav.ai&gt;<br />
                        To: user@example.com<br />
                        Subject: {subject || 'Your email subject'}
                      </div>
                      <div 
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: content || '<p>Your email content will appear here...</p>' 
                        }}
                      />
                      {ctaText && ctaUrl && (
                        <div className="mt-8 text-center">
                          <a 
                            href={ctaUrl}
                            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                          >
                            {ctaText}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>
            Track the performance of your email campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                subject: "🚀 New Feature: AI Assistant",
                sent: "2 days ago",
                recipients: 1234,
                openRate: 68,
                clickRate: 23,
                status: 'sent'
              },
              {
                subject: "🎉 We've reached 1000 users!",
                sent: "1 week ago",
                recipients: 987,
                openRate: 72,
                clickRate: 31,
                status: 'sent'
              },
              {
                subject: "📢 December Product Update",
                scheduled: "in 3 days",
                recipients: 1456,
                status: 'scheduled'
              }
            ].map((campaign, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{campaign.subject}</h4>
                  <p className="text-sm text-muted-foreground">
                    {campaign.status === 'scheduled' ? (
                      <>
                        <Calendar className="inline h-3 w-3 mr-1" />
                        Scheduled {campaign.scheduled}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="inline h-3 w-3 mr-1" />
                        Sent {campaign.sent} to {campaign.recipients} recipients
                      </>
                    )}
                  </p>
                </div>
                {campaign.status === 'sent' && (
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{campaign.openRate}%</p>
                      <p className="text-muted-foreground">Open Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{campaign.clickRate}%</p>
                      <p className="text-muted-foreground">Click Rate</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}