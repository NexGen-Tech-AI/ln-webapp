'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Plus, X, Users, Save } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Segment {
  id: string
  name: string
  description: string
  criteria: any
  user_count: number
  created_at: string
}

interface Criterion {
  field: string
  operator: string
  value: any
}

export function SegmentBuilder() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [creating, setCreating] = useState(false)
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    criteria: [] as Criterion[]
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSegments()
  }, [])

  const fetchSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_segments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSegments(data || [])
    } catch (error) {
      console.error('Error fetching segments:', error)
    }
  }

  const addCriterion = () => {
    setNewSegment({
      ...newSegment,
      criteria: [...newSegment.criteria, { field: '', operator: 'equals', value: '' }]
    })
  }

  const updateCriterion = (index: number, updates: Partial<Criterion>) => {
    const updatedCriteria = [...newSegment.criteria]
    updatedCriteria[index] = { ...updatedCriteria[index], ...updates }
    setNewSegment({ ...newSegment, criteria: updatedCriteria })
  }

  const removeCriterion = (index: number) => {
    setNewSegment({
      ...newSegment,
      criteria: newSegment.criteria.filter((_, i) => i !== index)
    })
  }

  const saveSegment = async () => {
    if (!newSegment.name || newSegment.criteria.length === 0) {
      toast({
        title: 'Invalid segment',
        description: 'Please provide a name and at least one criterion',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('user_segments')
        .insert({
          name: newSegment.name,
          description: newSegment.description,
          criteria: newSegment.criteria
        })

      if (error) throw error

      toast({
        title: 'Segment created',
        description: 'Your segment has been created successfully'
      })

      setNewSegment({ name: '', description: '', criteria: [] })
      setCreating(false)
      fetchSegments()
    } catch (error) {
      console.error('Error creating segment:', error)
      toast({
        title: 'Error',
        description: 'Failed to create segment',
        variant: 'destructive'
      })
    }
  }

  const previewSegment = async () => {
    // Build query based on criteria
    let query = supabase.from('users').select('*', { count: 'exact', head: true })

    newSegment.criteria.forEach(criterion => {
      switch (criterion.field) {
        case 'tier_preference':
          if (criterion.operator === 'equals') {
            query = query.eq('tier_preference', criterion.value)
          }
          break
        case 'referral_count':
          if (criterion.operator === 'greater_than') {
            query = query.gt('referral_count', parseInt(criterion.value))
          } else if (criterion.operator === 'less_than') {
            query = query.lt('referral_count', parseInt(criterion.value))
          }
          break
        case 'email_verified':
          query = query.eq('email_verified', criterion.value === 'true')
          break
        case 'interests':
          if (criterion.operator === 'contains') {
            query = query.contains('interests', [criterion.value])
          }
          break
      }
    })

    const { count, error } = await query

    if (error) {
      console.error('Error previewing segment:', error)
      return
    }

    toast({
      title: 'Segment Preview',
      description: `This segment would include ${count} users`
    })
  }

  return (
    <div className="space-y-6">
      {/* Existing Segments */}
      <Card className="glassmorphic-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Segments</CardTitle>
              <CardDescription>Create and manage user segments for targeted campaigns</CardDescription>
            </div>
            <Button onClick={() => setCreating(true)} disabled={creating}>
              <Plus className="h-4 w-4 mr-2" />
              New Segment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {segments.map(segment => (
              <div key={segment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{segment.name}</h3>
                    <p className="text-sm text-muted-foreground">{segment.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {segment.user_count} users
                      </Badge>
                      {segment.criteria.map((criterion: any, i: number) => (
                        <Badge key={i} variant="outline">
                          {criterion.field} {criterion.operator} {criterion.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Use Segment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Segment Builder */}
      {creating && (
        <Card className="glassmorphic-card">
          <CardHeader>
            <CardTitle>Create New Segment</CardTitle>
            <CardDescription>Define criteria to group users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Segment Name</Label>
                <Input
                  id="name"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                  placeholder="e.g., High-value users"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newSegment.description}
                  onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                  placeholder="Brief description of this segment"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Criteria</Label>
                <Button variant="outline" size="sm" onClick={addCriterion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Criterion
                </Button>
              </div>
              <div className="space-y-2">
                {newSegment.criteria.map((criterion, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={criterion.field}
                      onValueChange={(value) => updateCriterion(index, { field: value })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tier_preference">Tier Preference</SelectItem>
                        <SelectItem value="referral_count">Referral Count</SelectItem>
                        <SelectItem value="email_verified">Email Verified</SelectItem>
                        <SelectItem value="interests">Interests</SelectItem>
                        <SelectItem value="position">Waitlist Position</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={criterion.operator}
                      onValueChange={(value) => updateCriterion(index, { operator: value })}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={criterion.value}
                      onChange={(e) => updateCriterion(index, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCriterion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={previewSegment}>
                Preview
              </Button>
              <Button onClick={saveSegment}>
                <Save className="h-4 w-4 mr-2" />
                Save Segment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}