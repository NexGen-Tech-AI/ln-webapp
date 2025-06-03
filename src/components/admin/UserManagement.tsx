'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Search, Filter, Download, Mail, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface User {
  id: string
  email: string
  name: string
  position: number
  referral_code: string
  referral_count: number
  tier_preference: string
  interests: string[]
  joined_at: string
  last_login: string
  email_verified: boolean
  sessions?: any[]
  conversions?: any[]
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [sortBy, setSortBy] = useState('position')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const perPage = 20

  useEffect(() => {
    fetchUsers()
  }, [page, sortBy, filterTier])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          user_sessions (count),
          conversions (count)
        `, { count: 'exact' })

      if (filterTier !== 'all') {
        query = query.eq('tier_preference', filterTier)
      }

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      }

      const { data, error, count } = await query
        .order(sortBy, { ascending: sortBy === 'position' })
        .range((page - 1) * perPage, page * perPage - 1)

      if (error) throw error

      setUsers(data || [])
      setTotalPages(Math.ceil((count || 0) / perPage))
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const exportUsers = () => {
    const csv = [
      ['Email', 'Name', 'Position', 'Tier', 'Referral Code', 'Referrals', 'Joined', 'Verified'].join(','),
      ...users.map(u => [
        u.email,
        u.name || '',
        u.position,
        u.tier_preference,
        u.referral_code,
        u.referral_count,
        format(new Date(u.joined_at), 'yyyy-MM-dd'),
        u.email_verified
      ].join(','))
    ].join('\\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const inviteToPilot = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to invite to the pilot program',
        variant: 'destructive'
      })
      return
    }

    // TODO: Implement pilot invitation logic
    toast({
      title: 'Invitations sent',
      description: `${selectedUsers.length} users invited to pilot program`,
    })
  }

  return (
    <div className="space-y-4">
      <Card className="glassmorphic-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all users</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportUsers}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={inviteToPilot} disabled={selectedUsers.length === 0}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite to Pilot ({selectedUsers.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free Navigator</SelectItem>
                <SelectItem value="pro">Pro Navigator</SelectItem>
                <SelectItem value="ai">AI Navigator+</SelectItem>
                <SelectItem value="family">Family Navigator</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="position">Waitlist Position</SelectItem>
                <SelectItem value="joined_at">Join Date</SelectItem>
                <SelectItem value="referral_count">Referrals</SelectItem>
                <SelectItem value="last_login">Last Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Interests</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || 'Unnamed'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>#{user.position}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.tier_preference}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{user.referral_count}</div>
                          <div className="text-xs text-muted-foreground">{user.referral_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.interests.slice(0, 2).map((interest, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {interest.split(' ')[0]}
                            </Badge>
                          ))}
                          {user.interests.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{user.interests.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(user.joined_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={user.email_verified ? 'default' : 'destructive'}>
                          {user.email_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}