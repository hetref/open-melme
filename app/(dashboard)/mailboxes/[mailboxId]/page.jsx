"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  ArrowLeft,
  Lock,
  Key,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  Database,
  Activity,
  LogOut,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

const SingleMailboxPage = () => {
  const router = useRouter()
  const params = useParams()
  const mailboxId = params.mailboxId

  const [mailbox, setMailbox] = useState(null)
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshingSessions, setRefreshingSessions] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [settingsData, setSettingsData] = useState({
    name: '',
    senderName: '',
    description: '',
  })

  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    if (mailboxId) {
      fetchMailbox()
      fetchSessions()
      fetchStats()
    }
  }, [mailboxId])

  const fetchMailbox = async () => {
    try {
      const response = await fetch(`/api/mailboxes/${mailboxId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Mailbox not found')
          router.push('/mailboxes')
          return
        }
        throw new Error('Failed to fetch mailbox')
      }
      const data = await response.json()
      setMailbox(data.mailbox)
      // Initialize settings data
      setSettingsData({
        name: data.mailbox.name || '',
        senderName: data.mailbox.senderName || '',
        description: data.mailbox.description || '',
      })
    } catch (error) {
      console.error('Error fetching mailbox:', error)
      toast.error('Failed to load mailbox')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/mailboxes/${mailboxId}/sessions`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/mailboxes/${mailboxId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleRefreshSessions = async () => {
    setRefreshingSessions(true)
    try {
      await fetchSessions()
      toast.success('Sessions refreshed')
    } catch (error) {
      toast.error('Failed to refresh sessions')
    } finally {
      setRefreshingSessions(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      const response = await fetch(`/api/mailboxes/${mailboxId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !mailbox.isActive,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update mailbox status')
      }

      const data = await response.json()
      setMailbox(data.mailbox)
      toast.success(`Mailbox ${data.mailbox.isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error updating mailbox:', error)
      toast.error('Failed to update mailbox status')
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()

    if (!settingsData.name.trim()) {
      toast.error('Mailbox name is required')
      return
    }

    if (!settingsData.senderName.trim()) {
      toast.error('Sender name is required')
      return
    }

    setIsSavingSettings(true)

    try {
      const response = await fetch(`/api/mailboxes/${mailboxId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: settingsData.name.trim(),
          senderName: settingsData.senderName.trim(),
          description: settingsData.description.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update settings')
      }

      const data = await response.json()
      setMailbox(data.mailbox)
      setSettingsData({
        name: data.mailbox.name || '',
        senderName: data.mailbox.senderName || '',
        description: data.mailbox.description || '',
      })
      toast.success('Settings updated successfully')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error(error.message)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.error('New password must be different from current password')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/mailboxes/${mailboxId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast.success('Password changed successfully!')
      setIsChangePasswordDialogOpen(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      // Refresh sessions as they might be invalidated
      fetchSessions()
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevokeSession = async (sessionId) => {
    try {
      const response = await fetch(`/api/mailboxes/${mailboxId}/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke session')
      }

      toast.success('Session revoked')
      fetchSessions()
    } catch (error) {
      console.error('Error revoking session:', error)
      toast.error('Failed to revoke session')
    }
  }

  const handleDeleteMailbox = async (e) => {
    e.preventDefault()

    if (deleteConfirmation !== mailbox.slug) {
      toast.error('Slug does not match')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/mailboxes/${mailboxId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete mailbox')
      }

      toast.success('Mailbox deleted successfully')
      router.push('/mailboxes')
    } catch (error) {
      console.error('Error deleting mailbox:', error)
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

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffMinutes = Math.floor((expires - now) / (1000 * 60))

    if (diffMinutes <= 0) return 'Expired'
    if (diffMinutes < 60) return `${diffMinutes} min`

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mailbox...</p>
        </div>
      </div>
    )
  }

  if (!mailbox) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mailbox Not Found</h2>
          <p className="text-gray-600 mb-6">The mailbox you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/mailboxes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Mailboxes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/mailboxes')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Mailboxes
        </Button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 break-all">
                {mailbox.name}
              </h1>
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
            <p className="text-gray-600">{mailbox.domain.fullDomain}</p>
            <p className="text-sm text-gray-500 mt-1">Created {formatDate(mailbox.createdAt)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleToggleStatus}
            >
              {mailbox.isActive ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            <Button onClick={() => router.push('/my-mailbox')}>
              <Mail className="w-4 h-4 mr-2" />
              Access Mailbox
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold">{stats.totalEmails}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalReceived || 0} received • {stats.totalSent || 0} sent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold">{sessions.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Aliases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold">{stats.activeAliases}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Storage Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold">{stats.storageUsed}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.storageBytes?.toLocaleString() || 0} bytes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions ({sessions.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mailbox Information</CardTitle>
              <CardDescription>Basic details about this mailbox</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Mailbox Name</Label>
                  <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">
                    {mailbox.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Identifier (Slug)</Label>
                  <p className="text-sm font-mono mt-1 p-2 bg-gray-50 rounded border">
                    {mailbox.slug}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Sender Name</Label>
                  <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">
                    {mailbox.senderName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Assigned Aliases</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {mailbox.aliases && mailbox.aliases.length > 0 ? (
                      <div className="space-y-1">
                        {mailbox.aliases.map((alias) => (
                          <p key={alias.id} className="text-sm font-mono">
                            {alias.localPart}@{mailbox.domain?.fullDomain || 'N/A'}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No aliases assigned</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
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
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">
                    {formatDate(mailbox.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aliases Using This Mailbox</CardTitle>
              <CardDescription>
                Email aliases that forward to this mailbox
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mailbox.aliases && mailbox.aliases.length > 0 ? (
                <div className="space-y-2">
                  {mailbox.aliases.map((alias) => {
                    const fullEmail = `${alias.localPart}@${mailbox.domain.fullDomain}`
                    return (
                      <div
                        key={alias.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium font-mono">{fullEmail}</p>
                          <p className="text-sm text-gray-500">
                            Mode: {alias.mode === 'mailbox' ? 'Mailbox' : 'Forward'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/aliases/${alias.domainId}/${alias.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No aliases using this mailbox yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mailbox Settings</CardTitle>
              <CardDescription>Update mailbox display information and sender identity</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-4">
                  {/* Read-only info */}
                  <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Mailbox Identifier</Label>
                      <p className="text-sm font-mono mt-1 text-gray-900">
                        {mailbox.slug}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Assigned Aliases</Label>
                      {mailbox.aliases && mailbox.aliases.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {mailbox.aliases.map((alias) => (
                            <p key={alias.id} className="text-sm font-mono text-gray-900">
                              {alias.localPart}@{mailbox.domain?.fullDomain || 'N/A'}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">No aliases assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Editable fields */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Mailbox Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g., Support Mailbox"
                      value={settingsData.name}
                      onChange={(e) =>
                        setSettingsData({ ...settingsData, name: e.target.value })
                      }
                      disabled={isSavingSettings}
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Unique name for this mailbox (max 100 characters)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderName">
                      Sender Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="senderName"
                      type="text"
                      placeholder="e.g., John Doe"
                      value={settingsData.senderName}
                      onChange={(e) =>
                        setSettingsData({ ...settingsData, senderName: e.target.value })
                      }
                      disabled={isSavingSettings}
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Used as sender name in outbound emails (max 100 characters)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Add notes or description for this mailbox..."
                      value={settingsData.description}
                      onChange={(e) =>
                        setSettingsData({ ...settingsData, description: e.target.value })
                      }
                      disabled={isSavingSettings}
                      maxLength={500}
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">
                      For your reference only (max 500 characters)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button type="submit" disabled={isSavingSettings}>
                    {isSavingSettings ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSettingsData({
                        name: mailbox.name || '',
                        senderName: mailbox.senderName || '',
                        description: mailbox.description || '',
                      })
                    }}
                    disabled={isSavingSettings}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How Sender Identity Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Sender Name</strong> is shown in recipient's inbox as the sender name
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Mailbox Name</strong> is used for identification in your UI
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Email address remains the alias address (unchanged)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Changes apply immediately to new emails
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Manage mailbox authentication and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Mailbox Password</p>
                  <p className="text-sm text-blue-700 mt-1">
                    This password is separate from your account password and is required to access this mailbox.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsChangePasswordDialogOpen(true)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Delete Mailbox</p>
                  <p className="text-sm text-red-700 mt-1">
                    This will permanently delete the mailbox and all associated emails. This action cannot be undone.
                  </p>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Mailbox
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Currently authenticated sessions for this mailbox
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshSessions}
                  disabled={refreshingSessions}
                  title="Refresh sessions"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingSessions ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No active sessions</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Sessions appear here when someone logs into this mailbox
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <p className="font-medium text-sm">Active Session</p>
                          <Badge variant="outline" className="text-xs">
                            {new Date(session.expiresAt) > new Date() ? 'Valid' : 'Expired'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>Created: {formatDate(session.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(session.expiresAt) > new Date()
                                ? `Expires in ${formatTimeRemaining(session.expiresAt)}`
                                : 'Expired'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        className="flex-shrink-0"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Sessions expire after 1 hour of inactivity</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>You can revoke sessions at any time</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Changing the mailbox password invalidates all active sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Mailbox Password</DialogTitle>
            <DialogDescription>
              Update the password for this mailbox. All active sessions will be invalidated.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                disabled={isSubmitting}
                minLength={8}
                required
              />
              <p className="text-xs text-gray-500">At least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                disabled={isSubmitting}
                minLength={8}
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-xs text-yellow-800">
                  Changing the password will log out all active sessions. You'll need to login again with the new password.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsChangePasswordDialogOpen(false)
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Mailbox Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Mailbox</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the mailbox and all associated emails.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeleteMailbox} className="space-y-4 mt-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 mb-2">
                    This will delete:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                    <li>All emails in this mailbox</li>
                    <li>All active sessions</li>
                    <li>All aliases will be unlinked (not deleted)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deleteConfirmation">
                Type <span className="font-mono font-bold">{mailbox.slug}</span> to confirm
              </Label>
              <Input
                id="deleteConfirmation"
                type="text"
                placeholder={mailbox.slug}
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeleteConfirmation('')
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting || deleteConfirmation !== mailbox.slug}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Mailbox'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SingleMailboxPage
