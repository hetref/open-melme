"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Edit2, Power, PowerOff, Trash2, Mail, CheckCircle, XCircle, Clock, Calendar, Forward, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const AliasDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const { domainId, aliasId } = params

  const [alias, setAlias] = useState(null)
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
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
  })

  useEffect(() => {
    if (aliasId) {
      fetchAliasDetails()
      fetchEmails(1)
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
      setFormData({ forwardTo: data.alias.forwardTo })
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

  const handleUpdateAlias = async (e) => {
    e.preventDefault()

    if (!formData.forwardTo.trim()) {
      toast.error('Forward to email is required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/aliases/${aliasId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forwardTo: formData.forwardTo.trim(),
        }),
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
    if (!confirm(`Are you sure you want to delete this alias? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/aliases/${aliasId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete alias')
      }

      toast.success('Alias deleted successfully!')
      router.push(`/aliases/${domainId}`)
    } catch (error) {
      console.error('Error deleting alias:', error)
      toast.error(error.message)
    }
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alias details...</p>
        </div>
      </div>
    )
  }

  if (!alias) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Alias not found</h2>
          <Button onClick={() => router.push(`/aliases/${domainId}`)} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Aliases
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/aliases/${domainId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Aliases
        </Button>

        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 font-mono">{alias.fullEmail}</h1>
            <p className="text-gray-600 mt-2">Alias details and email logs</p>

            {/* Domain Connection Status */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Domain Status:</span>
                <Badge
                  variant={alias.domain.verificationStatus === 'verified' ? 'default' : 'secondary'}
                  className={
                    alias.domain.verificationStatus === 'verified'
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                  }
                >
                  {alias.domain.verificationStatus === 'verified' ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Last checked: {formatLastChecked(alias.domain.lastCheckedAt)}
              </div>
              {alias.statistics.pending > 0 && (
                <div className="flex items-center gap-1 text-sm text-yellow-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>{alias.statistics.pending} pending emails</span>
                </div>
              )}
            </div>

            {/* Warning Message */}
            {alias.domain.verificationStatus === 'pending' && alias.statistics.pending > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Emails were paused because the domain connection was lost.
                  Recheck the domain to resume delivery and process pending emails.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {/* Recheck Button */}
            {alias.domain.verificationStatus === 'pending' && alias.statistics.pending > 0 && (
              <Button
                onClick={handleRecheckDomain}
                disabled={isRechecking}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRechecking ? 'animate-spin' : ''}`} />
                {isRechecking ? 'Rechecking...' : 'Recheck & Process'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleToggleStatus}
            >
              {alias.isActive ? (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  Disable
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteAlias}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Alias Details Card */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Alias Information</CardTitle>
              <CardDescription>Configuration and forwarding settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Status</Label>
                <div className="mt-1">
                  <Badge
                    variant={alias.isActive ? 'default' : 'secondary'}
                    className={
                      alias.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                    }
                  >
                    {alias.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Email Address</Label>
                <p className="text-sm font-mono mt-1">{alias.fullEmail}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Forwards To</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Forward className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium">{alias.forwardTo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <Label className="text-sm text-gray-600">Created</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm">{formatDate(alias.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Last Updated</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm">{formatDate(alias.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Statistics</CardTitle>
              <CardDescription>Email processing metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{alias.statistics.total}</p>
                      <p className="text-sm text-gray-600">Total Emails</p>
                    </div>
                    <Mail className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-700">{alias.statistics.forwarded}</p>
                      <p className="text-sm text-gray-600">Forwarded</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-700">{alias.statistics.failed}</p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-700">{alias.statistics.received}</p>
                      <p className="text-sm text-gray-600">Received</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                {alias.statistics.pending > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-yellow-700">{alias.statistics.pending}</p>
                        <p className="text-sm text-gray-600">Pending</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Email Logs</CardTitle>
            <CardDescription>
              All emails received by this alias ({pagination.totalCount} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No emails received yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Emails sent to {alias.fullEmail} will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(email.status)}
                            <h3 className="font-medium text-gray-900 truncate">
                              {email.subject || '(No Subject)'}
                            </h3>
                            <Badge
                              variant="secondary"
                              className={getStatusBadge(email.status)}
                            >
                              {email.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">From:</span> {email.fromEmail}
                            </p>
                            <p>
                              <span className="font-medium">To:</span> {email.toEmail}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500 ml-4 shrink-0">
                          <p>{formatDate(email.createdAt)}</p>
                          <p className="text-xs mt-1">{formatSize(email.size)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600">
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
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alias</DialogTitle>
            <DialogDescription>
              Update forwarding email for {alias.fullEmail}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAlias} className="space-y-4 mt-4">
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
    </div>
  )
}

export default AliasDetailPage
