"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMailbox } from '../_context/MailboxContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, PenSquare, LogOut, Mail, Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const mailboxContext = useMailbox()
  const session = mailboxContext?.session
  const loading = mailboxContext?.loading
  const openComposeDialog = mailboxContext?.openComposeDialog
  const logout = mailboxContext?.logout
  const router = useRouter()

  const [settingsData, setSettingsData] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    if (!loading && !session) {
      // Not authenticated or session expired, redirect to my-mailbox parent for login
      router.push('/my-mailbox')
      return
    }

    // Check if session is expired
    if (session?.expiresAt) {
      const now = new Date()
      const expires = new Date(session.expiresAt)

      if (expires <= now) {
        // Session expired
        toast.info('Your session has expired. Please login again.')
        router.push('/my-mailbox')
        return
      }
    }

    // Fetch settings data
    if (session) {
      fetchSettings()
    }
  }, [session, loading, router])

  const fetchSettings = async () => {
    setLoadingSettings(true)
    try {
      const response = await fetch('/api/my-mailbox/settings')

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      setSettingsData(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load mailbox settings')
    } finally {
      setLoadingSettings(false)
    }
  }

  if (loading || loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground-dim">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const getSessionTimeRemaining = () => {
    if (!session?.expiresAt) return ''

    const now = new Date()
    const expires = new Date(session.expiresAt)
    const diffMinutes = Math.floor((expires - now) / (1000 * 60))

    if (diffMinutes <= 0) return 'Expired'
    if (diffMinutes < 60) return `${diffMinutes} min`

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-[var(--font-display)]">
              {session.mailbox.name}
            </h1>
            <p className="text-foreground-dim mt-2">Mailbox Settings</p>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              onClick={() => openComposeDialog && openComposeDialog()}
              disabled={!openComposeDialog}
              className="gap-2"
            >
              <PenSquare className="w-4 h-4" />
              Compose
            </Button>
            <Button
              onClick={logout}
              disabled={!logout}
              variant="outline"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Exit
            </Button>
            <div className="text-sm text-foreground-dim flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Session expires in {getSessionTimeRemaining()}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {/* Mailbox Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Mailbox Information
            </CardTitle>
            <CardDescription>
              Your mailbox details and current status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-foreground-dim">Mailbox Name</p>
                <p className="text-lg mt-1 text-foreground">{settingsData?.mailbox?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-dim">Sender Name</p>
                <p className="text-lg mt-1 text-foreground">{settingsData?.mailbox?.senderName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-dim">Personal / Assigned Email</p>
                <p className="text-lg mt-1 break-all text-foreground">
                  {settingsData?.mailbox?.personalEmail ||
                    settingsData?.mailbox?.assignedPersonalEmails?.[0] ||
                    'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-dim">Tags</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(settingsData?.mailbox?.tags || []).length > 0 ? (
                    settingsData.mailbox.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-foreground-dim">No tags assigned</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-dim">Status</p>
                <div className="mt-1">
                  {settingsData?.mailbox?.isActive ? (
                    <Badge variant="success" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-dim">Created</p>
                <p className="text-lg mt-1 text-foreground">
                  {settingsData?.mailbox?.createdAt
                    ? new Date(settingsData.mailbox.createdAt).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage & Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Storage & Statistics
            </CardTitle>
            <CardDescription>
              Your mailbox usage and email statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-surface-raised border border-border rounded-lg">
                <p className="text-sm font-medium text-foreground-dim mb-2">Storage Used</p>
                <p className="text-3xl font-bold text-foreground">
                  {settingsData?.stats?.storageUsed || '0 B'}
                </p>
                <p className="text-xs text-foreground-dim mt-1">
                  {settingsData?.stats?.storageBytes?.toLocaleString() || 0} bytes
                </p>
              </div>
              <div className="text-center p-4 bg-surface-raised border border-border rounded-lg">
                <p className="text-sm font-medium text-foreground-dim mb-2">Total Emails</p>
                <p className="text-3xl font-bold text-foreground">
                  {settingsData?.stats?.totalEmails?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-foreground-dim mt-1">
                  {settingsData?.stats?.totalReceived || 0} received • {settingsData?.stats?.totalSent || 0} sent
                </p>
              </div>
              <div className="text-center p-4 bg-surface-raised border border-border rounded-lg">
                <p className="text-sm font-medium text-foreground-dim mb-2">Active Aliases</p>
                <p className="text-3xl font-bold text-foreground">
                  {settingsData?.stats?.activeAliases || 0}
                </p>
                <p className="text-xs text-foreground-dim mt-1">
                  Receiving emails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Associated Aliases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Associated Email Aliases
            </CardTitle>
            <CardDescription>
              Email aliases that deliver to this mailbox
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!settingsData?.aliases || settingsData.aliases.length === 0 ? (
              <div className="text-center py-8 text-foreground-dim">
                <Mail className="w-12 h-12 mx-auto mb-3 text-muted" />
                <p>No aliases associated with this mailbox</p>
                <p className="text-sm mt-1">Create an alias to start receiving emails</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settingsData.aliases.map((alias) => (
                  <div
                    key={alias.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/40 transition-colors bg-surface"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted" />
                      <div>
                        <p className="font-mono font-medium">{alias.fullEmail}</p>
                        <p className="text-xs text-foreground-dim">Local part: {alias.localPart}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alias.isActive ? (
                        <Badge variant="success" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
