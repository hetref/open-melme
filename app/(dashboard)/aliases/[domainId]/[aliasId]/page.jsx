"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Edit2, Power, PowerOff, Trash2, Mail, CheckCircle, XCircle, Clock, Calendar, Forward, AlertCircle, RefreshCw, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { AliasDeletionModal } from '@/components/AliasDeletionModal'

const AliasDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const { domainId, aliasId } = params

  const [alias, setAlias] = useState(null)
  const [emails, setEmails] = useState([])
  const [mailboxes, setMailboxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRechecking, setIsRechecking] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  })

  const [formData, setFormData] = useState({
    forwardTo: '',
    mode: 'forward',
    mailboxId: '',
  })

  useEffect(() => {
    if (aliasId) {
      fetchAliasDetails()
      fetchEmails(1)
      fetchMailboxes()
    }
  }, [aliasId])

  const fetchAliasDetails = async () => {
    try {
      const response = await fetch(`/api/aliases/${aliasId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Alias not found')
          router.push(`/aliases/${domainId}`)
          return
        }
        throw new Error('Failed to fetch alias')
      }
      const data = await response.json()
      setAlias(data.alias)
      setFormData({
        forwardTo: data.alias.forwardTo || '',
        mode: data.alias.mode,
        mailboxId: data.alias.mailboxId || '',
      })
    } catch (error) {
      console.error('Error fetching alias:', error)
      toast.error('Failed to load alias')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = async (page = 1) => {
    setEmailsLoading(true)
    try {
      const response = await fetch(`/api/aliases/${aliasId}/emails?page=${page}&limit=20`)
      if (!response.ok) {
        throw new Error('Failed to fetch emails')
      }
      const data = await response.json()
      setEmails(data.emails)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching emails:', error)
      toast.error('Failed to load emails')
    } finally {
      setEmailsLoading(false)
    }
  }

  const fetchMailboxes = async () => {
    try {
      const response = await fetch('/api/mailboxes')
      if (!response.ok) throw new Error('Failed to fetch mailboxes')
      const data = await response.json()
      // Show ALL active mailboxes for the user (no domain filtering)
      const activeMailboxes = data.mailboxes.filter(m => m.isActive)
      setMailboxes(activeMailboxes)
    } catch (error) {
      console.error('Error fetching mailboxes:', error)
    }
  }

  const handleUpdateAlias = async (e) => {
    e.preventDefault()

    if (alias.mode === 'forward' && !formData.forwardTo.trim()) {
      toast.error('Forward to email is required')
      return
    }

    if (alias.mode === 'mailbox' && !formData.mailboxId) {
      toast.error('Please select a mailbox')
      return
    }

    setIsSubmitting(true)

    try {
      const body = {}

      if (alias.mode === 'forward') {
        body.forwardTo = formData.forwardTo.trim()
      } else {
        body.mailboxId = formData.mailboxId
      }

      const response = await fetch(`/api/aliases/${aliasId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update alias')
      }

      toast.success('Alias updated successfully!')
      setIsEditDialogOpen(false)
      fetchAliasDetails()
    } catch (error) {
      console.error('Error updating alias:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      const response = await fetch(`/api/aliases/${aliasId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !alias.isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to toggle alias status')
      }

      toast.success(`Alias ${alias.isActive ? 'disabled' : 'enabled'} successfully!`)
      fetchAliasDetails()
    } catch (error) {
      console.error('Error toggling alias status:', error)
      toast.error(error.message)
    }
  }

  const handleDeleteAlias = async () => {
    // Open the deletion modal
    setIsDeleteDialogOpen(true)
  }

  const handleDeletionSuccess = () => {
    router.push(`/aliases/${domainId}`)
  }

  const handleRecheckDomain = async () => {
    setIsRechecking(true)

    try {
      const response = await fetch(`/api/domains/${domainId}/recheck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aliasId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to recheck domain')
      }

      if (data.pendingEmailsProcessed) {
        toast.success(data.message || `Processed ${data.processedCount} pending emails for this alias!`)
      } else {
        if (data.newStatus === 'verified') {
          toast.success('Domain is connected and verified!')
        } else {
          toast.warning('Domain is still disconnected. Please verify your DNS records.')
        }
      }

      // Refresh data
      fetchAliasDetails()
      fetchEmails(pagination.page)
    } catch (error) {
      console.error('Error rechecking domain:', error)
      toast.error(error.message)
    } finally {
      setIsRechecking(false)
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

  const formatLastChecked = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'forwarded':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'received':
        return <Clock className="w-4 h-4 text-blue-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      forwarded: 'bg-green-100 text-green-800 hover:bg-green-100',
      failed: 'bg-red-100 text-red-800 hover:bg-red-100',
      received: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      invalid: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    }
    return variants[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-4 text-foreground-dim">Loading alias details...</p>
        </div>
      </div>
    )
  }

  if (!alias) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-foreground mb-2">Alias not found</h2>
          <button
            type="button"
            onClick={() => router.push(`/aliases/${domainId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Aliases
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link
        href={`/aliases/${domainId}`}
        className="inline-flex items-center gap-2 text-foreground-dim hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back to Aliases</span>
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="font-mono text-xl lg:text-2xl font-bold text-foreground">
              {alias.fullEmail}
            </h1>
            {alias.mode === 'mailbox' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Inbox size={12} />
                Mailbox
              </span>
            )}
          </div>
          <p className="text-foreground-dim mb-3">Alias details and email logs</p>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-foreground-dim">Domain Status:</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                alias.domain.verificationStatus === 'verified'
                  ? 'bg-[#22c55e]/10 text-[#22c55e]'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              {alias.domain.verificationStatus === 'verified' ? 'Connected' : 'Pending'}
            </span>
            <span className="text-muted">Last checked: {formatLastChecked(alias.domain.lastCheckedAt)}</span>
            {alias.statistics.pending > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                {alias.statistics.pending} pending emails
              </span>
            )}
          </div>

          {alias.domain.verificationStatus === 'pending' && alias.statistics.pending > 0 && (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-700">
                Emails were paused because the domain connection was lost.
                Recheck the domain to resume delivery and process pending emails.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {alias.domain.verificationStatus === 'pending' && alias.statistics.pending > 0 && (
            <button
              type="button"
              onClick={handleRecheckDomain}
              disabled={isRechecking}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface-raised text-sm font-medium text-foreground-dim"
            >
              <RefreshCw className={`w-4 h-4 ${isRechecking ? 'animate-spin' : ''}`} />
              {isRechecking ? 'Rechecking...' : 'Recheck & Process'}
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleStatus}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface-raised text-sm font-medium text-foreground-dim"
          >
            {alias.isActive ? (
              <>
                <PowerOff className="w-4 h-4" />
                Disable
              </>
            ) : (
              <>
                <Power className="w-4 h-4" />
                Enable
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsEditDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface-raised text-sm font-medium text-foreground-dim"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDeleteAlias}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 text-sm font-medium text-foreground-dim hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-6"
        >
          <h2 className="text-base font-semibold text-foreground mb-1">Alias Information</h2>
          <p className="text-sm text-foreground-dim mb-5">Configuration and forwarding settings</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-foreground-dim block mb-1">Status</label>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                  alias.isActive ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-muted/20 text-muted'
                }`}
              >
                {alias.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div>
              <label className="text-sm text-foreground-dim block mb-1">Email Address</label>
              <p className="font-mono text-sm text-foreground">{alias.fullEmail}</p>
            </div>

            <div>
              <label className="text-sm text-foreground-dim block mb-1">Mode</label>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                {alias.mode === 'mailbox' ? 'Store in Mailbox' : 'Forward to Email'}
              </span>
            </div>

            {alias.mode === 'forward' ? (
              <div>
                <label className="text-sm text-foreground-dim block mb-1">Forwards To</label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Forward size={14} className="text-muted" />
                  {alias.forwardTo}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm text-foreground-dim block mb-1">Mailbox</label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Mail size={14} className="text-muted" />
                  {alias.mailbox?.name || 'Unknown'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <label className="text-sm text-foreground-dim block mb-1">Created</label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar size={14} className="text-muted" />
                  {formatDate(alias.createdAt)}
                </div>
              </div>
              <div>
                <label className="text-sm text-foreground-dim block mb-1">Last Updated</label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar size={14} className="text-muted" />
                  {formatDate(alias.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-2xl p-6"
        >
          <h2 className="text-base font-semibold text-foreground mb-1">Email Statistics</h2>
          <p className="text-sm text-foreground-dim mb-5">Email processing metrics</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3b82f6]">{alias.statistics.total}</div>
                <div className="text-sm text-[#3b82f6]/70">Total Emails</div>
              </div>
              <Mail size={24} className="text-[#3b82f6]/50" />
            </div>
            <div className="bg-[#22c55e]/5 border border-[#22c55e]/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#22c55e]">{alias.statistics.forwarded}</div>
                <div className="text-sm text-[#22c55e]/70">Forwarded</div>
              </div>
              <CheckCircle size={24} className="text-[#22c55e]/50" />
            </div>
            <div className="bg-[#ef4444]/5 border border-[#ef4444]/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#ef4444]">{alias.statistics.failed}</div>
                <div className="text-sm text-[#ef4444]/70">Failed</div>
              </div>
              <XCircle size={24} className="text-[#ef4444]/50" />
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{alias.statistics.received}</div>
                <div className="text-sm text-primary/70">Received</div>
              </div>
              <Clock size={24} className="text-primary/50" />
            </div>
            {alias.statistics.pending > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600">{alias.statistics.pending}</div>
                  <div className="text-sm text-amber-600/70">Pending</div>
                </div>
                <AlertCircle size={24} className="text-amber-500/60" />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-border rounded-2xl p-6"
      >
        <h2 className="text-base font-semibold text-foreground mb-1">Email Logs</h2>
        <p className="text-sm text-foreground-dim mb-5">
          All emails received by this alias ({pagination.totalCount} total)
        </p>

        {emailsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-foreground-dim">No emails received yet</p>
            <p className="text-sm text-muted mt-2">
              Emails sent to {alias.fullEmail} will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {emails.map((email, index) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="bg-background border border-border rounded-xl p-4 hover:border-primary/20 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock size={14} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="text-sm font-medium text-foreground truncate max-w-md">
                              {email.subject || '(No Subject)'}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadge(email.status)}`}>
                              {email.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-foreground-dim">
                            <span>From: <span className="text-foreground">{email.fromEmail}</span></span>
                            <span>To: <span className="text-foreground">{email.toEmail}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-11 lg:pl-0">
                      <div className="text-xs text-foreground-dim">{formatDate(email.createdAt)}</div>
                      <div className="text-xs text-muted">{formatSize(email.size)}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <p className="text-sm text-foreground-dim">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEmails(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEmails(pagination.page + 1)}
                    disabled={!pagination.hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-surface border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Alias</DialogTitle>
            <DialogDescription>
              Update {alias?.mode === 'forward' ? 'forwarding email' : 'mailbox'} for {alias.fullEmail}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAlias} className="space-y-4 mt-4">
            {alias?.mode === 'forward' ? (
              <div className="space-y-2">
                <Label htmlFor="forwardTo">Forward To Email</Label>
                <Input
                  id="forwardTo"
                  type="email"
                  placeholder="your-email@gmail.com"
                  value={formData.forwardTo}
                  onChange={(e) =>
                    setFormData({ ...formData, forwardTo: e.target.value })
                  }
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                <p className="text-sm text-gray-500">
                  Emails will be forwarded to this address
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="editMailboxId">Select Mailbox</Label>
                {mailboxes.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    No mailboxes available for this domain. Create a mailbox first.
                  </div>
                ) : (
                  <select
                    id="editMailboxId"
                    value={formData.mailboxId}
                    onChange={(e) => setFormData({ ...formData, mailboxId: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select a mailbox...</option>
                    {mailboxes.map((mailbox) => (
                      <option key={mailbox.id} value={mailbox.id}>
                        {mailbox.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-sm text-gray-500">
                  Emails will be stored in the selected mailbox (not forwarded)
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Alias'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alias Deletion Modal */}
      <AliasDeletionModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        alias={alias ? {
          id: alias.id,
          localPart: alias.localPart,
          mode: alias.mode,
          domainName: alias.domain?.fullDomain,
        } : null}
        onSuccess={handleDeletionSuccess}
      />
    </div>
  )
}

export default AliasDetailPage
