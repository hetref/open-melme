"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Plus, Lock, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

const MailboxesPage = () => {
  const router = useRouter()
  const [mailboxes, setMailboxes] = useState([])
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [domainsLoading, setDomainsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    domainId: '',
    localPart: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    fetchMailboxes()
  }, [])

  useEffect(() => {
    if (isCreateDialogOpen && domains.length === 0) {
      fetchDomains()
    }
  }, [isCreateDialogOpen])

  const fetchMailboxes = async () => {
    try {
      const response = await fetch('/api/mailboxes')
      if (!response.ok) {
        throw new Error('Failed to fetch mailboxes')
      }
      const data = await response.json()
      setMailboxes(data.mailboxes)
    } catch (error) {
      console.error('Error fetching mailboxes:', error)
      toast.error('Failed to load mailboxes')
    } finally {
      setLoading(false)
    }
  }

  const fetchDomains = async () => {
    setDomainsLoading(true)
    try {
      const response = await fetch('/api/domains')
      if (!response.ok) {
        throw new Error('Failed to fetch domains')
      }
      const data = await response.json()
      // Only show verified domains
      const verifiedDomains = data.domains.filter(
        (d) => d.verificationStatus === 'verified'
      )
      setDomains(verifiedDomains)
    } catch (error) {
      console.error('Error fetching domains:', error)
      toast.error('Failed to load domains')
    } finally {
      setDomainsLoading(false)
    }
  }

  const handleCreateMailbox = async (e) => {
    e.preventDefault()

    if (!formData.domainId || !formData.localPart || !formData.password || !formData.confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/mailboxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId: formData.domainId,
          localPart: formData.localPart.toLowerCase().trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create mailbox')
      }

      toast.success('Mailbox created successfully!')
      setIsCreateDialogOpen(false)
      setFormData({
        domainId: '',
        localPart: '',
        password: '',
        confirmPassword: '',
      })
      fetchMailboxes()
    } catch (error) {
      console.error('Error creating mailbox:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mailboxes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mailboxes</h1>
            <p className="text-gray-600 mt-2">
              Secure mailboxes for receiving and storing emails
            </p>
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Mailbox
          </Button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Mailbox Security</p>
              <p className="text-sm text-blue-700 mt-1">
                • Mailbox access requires a separate password<br />
                • Mailbox sessions expire after 1 hour<br />
                • Exiting mailbox logs you out immediately
              </p>
            </div>
          </div>
        </div>

        {/* Mailboxes List */}
        {mailboxes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No mailboxes yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Create your first mailbox to start receiving emails without forwarding them.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Mailbox
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mailboxes.map((mailbox) => (
              <Card key={mailbox.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Mail className="w-10 h-10 text-blue-600" />
                    <Badge
                      variant={mailbox.isActive ? 'default' : 'secondary'}
                      className={
                        mailbox.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      }
                    >
                      {mailbox.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-mono mt-2 break-all">
                    {mailbox.emailAlias}
                  </CardTitle>
                  <CardDescription>{mailbox.domain.fullDomain}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Active Sessions:</span>
                      <Badge variant="outline">
                        {mailbox._count.sessions}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created {formatDate(mailbox.createdAt)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/mailboxes/${mailbox.id}`)}
                      >
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push('/my-mailbox')}
                      >
                        Access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Mailbox Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Mailbox</DialogTitle>
            <DialogDescription>
              Create a secure mailbox to receive and store emails without forwarding
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMailbox} className="space-y-4 mt-4">
            {/* Domain Selection */}
            <div className="space-y-2">
              <Label htmlFor="domainId">Domain *</Label>
              {domainsLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                </div>
              ) : domains.length === 0 ? (
                <div className="text-sm text-gray-600 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  No verified domains available. Please verify a domain first.
                </div>
              ) : (
                <select
                  id="domainId"
                  value={formData.domainId}
                  onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select a domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.fullDomain}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Local Part */}
            <div className="space-y-2">
              <Label htmlFor="localPart">Alias *</Label>
              <Input
                id="localPart"
                type="text"
                placeholder="support"
                value={formData.localPart}
                onChange={(e) =>
                  setFormData({ ...formData, localPart: e.target.value })
                }
                disabled={isSubmitting}
                pattern="[a-z0-9._-]+"
                title="Use only lowercase letters, numbers, dots, hyphens, and underscores"
                required
              />
              <p className="text-xs text-gray-500">
                Use lowercase letters, numbers, dots, hyphens, and underscores
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Mailbox Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter mailbox password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={isSubmitting}
                minLength={8}
                required
              />
              <p className="text-xs text-gray-500">
                At least 8 characters. This is separate from your account password.
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm mailbox password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                disabled={isSubmitting}
                minLength={8}
                required
              />
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-xs text-yellow-800">
                  This mailbox password is separate from your account password.
                  Store it securely - you'll need it to access your mailbox.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setFormData({
                    domainId: '',
                    localPart: '',
                    password: '',
                    confirmPassword: '',
                  })
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || domains.length === 0}>
                {isSubmitting ? 'Creating...' : 'Create Mailbox'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MailboxesPage
