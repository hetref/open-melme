"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Lock, LogOut, AlertCircle, Clock, CheckCircle, XCircle, ArrowLeft, X, RefreshCw, Download, Search, Filter, Paperclip, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

const MyMailboxPage = () => {
  const [session, setSession] = useState(null)
  const [mailboxes, setMailboxes] = useState([])
  const [emails, setEmails] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedEmailDetail, setSelectedEmailDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [emailDetailLoading, setEmailDetailLoading] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isMobilePreview, setIsMobilePreview] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [downloadingAttachment, setDownloadingAttachment] = useState(null)
  const [processingAttachments, setProcessingAttachments] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showImages, setShowImages] = useState(false)
  const [emailView, setEmailView] = useState('html') // 'html' or 'text'
  const [aliases, setAliases] = useState([])

  const [filters, setFilters] = useState({
    query: '',
    from: '',
    aliasId: '',
    hasAttachments: false,
    dateFrom: '',
    dateTo: '',
  })

  const [loginData, setLoginData] = useState({
    mailboxId: '',
    password: '',
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  })

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    if (session) {
      fetchAliases()
      fetchEmails(1)
    }
  }, [session])

  useEffect(() => {
    if (session) {
      fetchEmails(1)
    }
  }, [filters])

  // ESC key handler to close preview
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && selectedEmail) {
        setSelectedEmail(null)
        setSelectedEmailDetail(null)
        setIsMobilePreview(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEmail])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/mailbox-auth/session')

      if (response.ok) {
        const data = await response.json()
        setSession(data)
      } else {
        // No session, show login dialog
        fetchMailboxes()
        setIsLoginDialogOpen(true)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      fetchMailboxes()
      setIsLoginDialogOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchMailboxes = async () => {
    try {
      const response = await fetch('/api/mailboxes')
      if (!response.ok) {
        throw new Error('Failed to fetch mailboxes')
      }
      const data = await response.json()
      setMailboxes(data.mailboxes.filter((m) => m.isActive))
    } catch (error) {
      console.error('Error fetching mailboxes:', error)
      toast.error('Failed to load mailboxes')
    }
  }

  const fetchAliases = async () => {
    try {
      const response = await fetch('/api/aliases')
      if (!response.ok) return

      const data = await response.json()
      setAliases(data.aliases || [])
    } catch (error) {
      console.error('Error fetching aliases:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!loginData.mailboxId || !loginData.password) {
      toast.error('Please select a mailbox and enter password')
      return
    }

    setIsLoggingIn(true)

    try {
      const response = await fetch('/api/mailbox-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login')
      }

      toast.success('Login successful!')
      setSession(data)
      setIsLoginDialogOpen(false)
      setLoginData({ mailboxId: '', password: '' })
      fetchEmails(1)
    } catch (error) {
      console.error('Error logging in:', error)
      toast.error(error.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/mailbox-auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to logout')
      }

      toast.success('Logged out successfully')
      setSession(null)
      setEmails([])
      setSelectedEmail(null)
      setIsLoginDialogOpen(true)
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to logout')
    }
  }

  const fetchEmails = async (page = 1) => {
    setEmailsLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (filters.query) params.append('query', filters.query)
      if (filters.from) params.append('from', filters.from)
      if (filters.aliasId) params.append('aliasId', filters.aliasId)
      if (filters.hasAttachments) params.append('hasAttachments', 'true')
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      const response = await fetch(`/api/my-mailbox/emails?${params.toString()}`)

      if (response.status === 401) {
        // Session expired
        toast.error('Session expired. Please login again.')
        setSession(null)
        setIsLoginDialogOpen(true)
        return
      }

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

  const fetchEmailDetail = async (emailId) => {
    setEmailDetailLoading(true)
    try {
      const response = await fetch(`/api/my-mailbox/emails/${emailId}`)

      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        setSession(null)
        setIsLoginDialogOpen(true)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch email')
      }

      const data = await response.json()
      setSelectedEmailDetail(data.email)
    } catch (error) {
      console.error('Error fetching email:', error)
      toast.error('Failed to load email')
    } finally {
      setEmailDetailLoading(false)
    }
  }

  const handleEmailClick = (email) => {
    // If clicking the same email, close it
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(null)
      setSelectedEmailDetail(null)
      setIsMobilePreview(false)
      return
    }

    setSelectedEmail(email)
    setShowImages(false) // Reset image display state
    setEmailView('html') // Reset to HTML view
    fetchEmailDetail(email.id)

    // On mobile, show preview instead of list
    if (window.innerWidth < 768) {
      setIsMobilePreview(true)
    }
  }

  const handleLoadImages = () => {
    if (!selectedEmailDetail) return
    setShowImages(true)
    toast.success('Images loaded')
  }

  const handleClearFilters = () => {
    setFilters({
      query: '',
      from: '',
      aliasId: '',
      hasAttachments: false,
      dateFrom: '',
      dateTo: '',
    })
  }

  const hasActiveFilters = () => {
    return filters.query || filters.from || filters.aliasId || filters.hasAttachments || filters.dateFrom || filters.dateTo
  }

  const handleBackToList = () => {
    setSelectedEmail(null)
    setSelectedEmailDetail(null)
    setIsMobilePreview(false)
  }

  const handleRefreshEmails = async () => {
    setIsRefreshing(true)
    try {
      await fetchEmails(pagination.page)
      toast.success('Email list refreshed')
    } catch (error) {
      console.error('Error refreshing emails:', error)
      toast.error('Failed to refresh emails')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDownloadAttachment = async (attachmentIndex, filename) => {
    setDownloadingAttachment(attachmentIndex)
    try {
      const response = await fetch(
        `/api/my-mailbox/emails/${selectedEmail.id}/attachment/${attachmentIndex}`
      )

      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        setSession(null)
        setIsLoginDialogOpen(true)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to generate download URL')
      }

      const data = await response.json()

      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = data.filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Downloading ${data.filename}`)
    } catch (error) {
      console.error('Error downloading attachment:', error)
      toast.error('Failed to download attachment')
    } finally {
      setDownloadingAttachment(null)
    }
  }

  const handleProcessAttachments = async () => {
    if (!selectedEmail) return

    setProcessingAttachments(true)
    try {
      const response = await fetch(
        `/api/my-mailbox/emails/${selectedEmail.id}/process-attachments`,
        {
          method: 'POST',
        }
      )

      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        setSession(null)
        setIsLoginDialogOpen(true)
        return
      }

      if (response.status === 409) {
        toast.error('Attachments are currently being processed. Please wait.')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to process attachments')
      }

      const data = await response.json()
      toast.success(data.message)

      // Refresh email detail to get updated attachment info
      await fetchEmailDetail(selectedEmail.id)
    } catch (error) {
      console.error('Error processing attachments:', error)
      toast.error(error.message || 'Failed to process attachments')
    } finally {
      setProcessingAttachments(false)
    }
  }

  const handleDownloadProcessedAttachment = async (attachmentId, filename) => {
    setDownloadingAttachment(attachmentId)
    try {
      const response = await fetch(
        `/api/my-mailbox/attachments/${attachmentId}/download`
      )

      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        setSession(null)
        setIsLoginDialogOpen(true)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to generate download URL')
      }

      const data = await response.json()

      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = data.filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Downloading ${data.filename}`)
    } catch (error) {
      console.error('Error downloading attachment:', error)
      toast.error('Failed to download attachment')
    } finally {
      setDownloadingAttachment(null)
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

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'received':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      received: 'bg-green-100 text-green-800 hover:bg-green-100',
      failed: 'bg-red-100 text-red-800 hover:bg-red-100',
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    }
    return variants[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16">
          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mailbox Access Required</h2>
          <p className="text-gray-600 mb-6">Please login to access your mailbox</p>
          <Button onClick={() => setIsLoginDialogOpen(true)}>
            <Lock className="w-4 h-4 mr-2" />
            Login to Mailbox
          </Button>
        </div>

        {/* Login Dialog */}
        <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mailbox Login</DialogTitle>
              <DialogDescription>
                Enter your mailbox password to access emails
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="mailboxId">Select Mailbox *</Label>
                {mailboxes.length === 0 ? (
                  <div className="text-sm text-gray-600 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    No active mailboxes available. Please create a mailbox first.
                  </div>
                ) : (
                  <select
                    id="mailboxId"
                    value={loginData.mailboxId}
                    onChange={(e) => setLoginData({ ...loginData, mailboxId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoggingIn}
                    required
                  >
                    <option value="">Select a mailbox</option>
                    {mailboxes.map((mailbox) => (
                      <option key={mailbox.id} value={mailbox.id}>
                        {mailbox.emailAlias}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mailbox Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter mailbox password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  disabled={isLoggingIn}
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  Mailbox sessions expire after 1 hour
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLoginDialogOpen(false)}
                  disabled={isLoggingIn}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoggingIn || mailboxes.length === 0}>
                  {isLoggingIn ? 'Logging in...' : 'Access Mailbox'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-mono">
              {session.mailbox.emailAlias}
            </h1>
            <p className="text-gray-600 mt-2">Mailbox emails</p>
          </div>

          <div className="flex gap-2 items-center">
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Session expires in {getSessionTimeRemaining()}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Exit Mailbox
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Mailbox Mode</p>
              <p className="text-sm text-yellow-700 mt-1">
                Emails are stored here and NOT forwarded. Replying is not yet supported.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Split View | Mobile: Toggle View */}
      <div className="flex gap-4 h-[calc(100%-12rem)]">
        {/* Email List - Hidden on mobile when preview is shown */}
        <div className={`${isMobilePreview ? 'hidden md:block' : 'block'} w-full md:w-96 shrink-0`}>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <CardTitle>Emails</CardTitle>
                  <CardDescription>
                    {pagination.totalCount} emails
                    {hasActiveFilters() && ' (filtered)'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    title="Toggle filters"
                  >
                    <Filter className={`w-4 h-4 ${hasActiveFilters() ? 'text-blue-600' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefreshEmails}
                    disabled={isRefreshing || emailsLoading}
                    title="Refresh email list"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Search & Filters */}
              {showFilters && (
                <div className="space-y-3 pt-3 border-t">
                  <div>
                    <Input
                      placeholder="Search subject or from..."
                      value={filters.query}
                      onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <select
                      value={filters.aliasId}
                      onChange={(e) => setFilters({ ...filters, aliasId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All aliases</option>
                      {aliases.map((alias) => (
                        <option key={alias.id} value={alias.id}>
                          {alias.localPart}@{alias.domain?.fullDomain}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasAttachments"
                      checked={filters.hasAttachments}
                      onChange={(e) => setFilters({ ...filters, hasAttachments: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="hasAttachments" className="text-sm cursor-pointer">
                      Has attachments
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">From date</Label>
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">To date</Label>
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {hasActiveFilters() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                      className="w-full"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {emailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No emails yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Emails sent to {session.mailbox.emailAlias} will appear here
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        className={`border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer ${selectedEmail?.id === email.id ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                        onClick={() => handleEmailClick(email)}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          {getStatusIcon(email.status)}
                          <h3 className="font-medium text-gray-900 truncate flex-1 text-sm">
                            {email.subject || '(No Subject)'}
                          </h3>
                          {email._count?.attachments > 0 && (
                            <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {email.fromEmail}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="secondary" className={`text-xs ${getStatusBadge(email.status)}`}>
                            {email.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(email.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-600">
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

        {/* Email Preview - Always shown on desktop, replaces list on mobile */}
        <div className={`${isMobilePreview ? 'block' : 'hidden md:block'} flex-1`}>
          {selectedEmail ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Mobile back button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mb-2 md:hidden"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to list
                    </Button>
                    <CardTitle className="text-xl wrap-break-word">
                      {selectedEmail.subject || '(No Subject)'}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      From: {selectedEmail.fromEmail}
                    </CardDescription>
                  </div>
                  {/* Desktop close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex"
                    onClick={() => {
                      setSelectedEmail(null)
                      setSelectedEmailDetail(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-6">
                {emailDetailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : selectedEmailDetail ? (
                  <div className="space-y-4">
                    {/* Headers */}
                    <div className="bg-gray-50 rounded p-3 space-y-2 text-sm">
                      <div><span className="font-medium">From:</span> {selectedEmailDetail.headers.from}</div>
                      <div><span className="font-medium">To:</span> {selectedEmailDetail.headers.to}</div>
                      {selectedEmailDetail.headers.cc && (
                        <div><span className="font-medium">Cc:</span> {selectedEmailDetail.headers.cc}</div>
                      )}
                      <div><span className="font-medium">Date:</span> {formatDate(selectedEmailDetail.headers.date)}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <Badge variant="secondary" className={getStatusBadge(selectedEmailDetail.status)}>
                          {selectedEmailDetail.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Body */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Message</h4>
                        <div className="flex gap-2 items-center">
                          {selectedEmailDetail.body.hasImages && !showImages && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleLoadImages}
                              className="text-xs"
                            >
                              <ImageIcon className="w-3 h-3 mr-1" />
                              Load images
                            </Button>
                          )}
                          <Tabs value={emailView} onValueChange={setEmailView} className="w-auto">
                            <TabsList className="h-8">
                              <TabsTrigger value="html" className="text-xs px-3 py-1">
                                Safe HTML
                              </TabsTrigger>
                              <TabsTrigger value="text" className="text-xs px-3 py-1">
                                Plain text
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                      </div>

                      {selectedEmailDetail.body.hasImages && !showImages && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">Images are blocked for your privacy</p>
                            <p className="mt-1 text-xs">Images can reveal your IP address and location. Click "Load images" above if you trust the sender.</p>
                          </div>
                        </div>
                      )}

                      <div className="border rounded p-4 bg-white">
                        {emailView === 'html' ? (
                          (() => {
                            const htmlToRender = showImages
                              ? selectedEmailDetail.body.safeHtmlWithImages
                              : selectedEmailDetail.body.safeHtmlNoImages

                            return htmlToRender ? (
                              <div
                                dangerouslySetInnerHTML={{ __html: htmlToRender }}
                                className="prose max-w-none text-sm"
                              />
                            ) : (
                              <pre className="whitespace-pre-wrap text-sm font-sans text-gray-600">
                                {selectedEmailDetail.body.text || '(No content)'}
                              </pre>
                            )
                          })()
                        ) : (
                          <pre className="whitespace-pre-wrap text-sm font-sans">
                            {selectedEmailDetail.body.text || '(No text content)'}
                          </pre>
                        )}
                      </div>
                    </div>

                    {/* Attachments */}
                    {selectedEmailDetail.attachmentsCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            Attachments ({selectedEmailDetail.attachmentsCount})
                          </h4>
                          {selectedEmailDetail.attachmentsStatus === 'not_processed' && (
                            <Button
                              size="sm"
                              onClick={handleProcessAttachments}
                              disabled={processingAttachments}
                            >
                              {processingAttachments ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Processing...
                                </>
                              ) : (
                                'Process attachments'
                              )}
                            </Button>
                          )}
                          {selectedEmailDetail.attachmentsStatus === 'processing' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-2"></div>
                              Processing attachments...
                            </Badge>
                          )}
                          {selectedEmailDetail.attachmentsStatus === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleProcessAttachments}
                              disabled={processingAttachments}
                            >
                              {processingAttachments ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                                  Retrying...
                                </>
                              ) : (
                                'Retry attachment processing'
                              )}
                            </Button>
                          )}
                        </div>

                        {selectedEmailDetail.attachmentsStatus === 'not_processed' && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                            <AlertCircle className="w-4 h-4 inline mr-2" />
                            Attachments are processed only when needed. Click "Process attachments" to extract them.
                          </div>
                        )}

                        {selectedEmailDetail.attachmentsStatus === 'processing' && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Processing attachments may take a few seconds. Please wait...
                          </div>
                        )}

                        {selectedEmailDetail.attachmentsStatus === 'failed' && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <XCircle className="w-4 h-4 inline mr-2" />
                            Failed to process attachments: {selectedEmailDetail.attachmentsError || 'Unknown error'}
                          </div>
                        )}

                        {selectedEmailDetail.attachmentsStatus === 'completed' &&
                          selectedEmailDetail.processedAttachments &&
                          selectedEmailDetail.processedAttachments.length > 0 && (
                            <div className="space-y-2">
                              {selectedEmailDetail.processedAttachments.map((att) => (
                                <div key={att.id} className="flex items-center gap-2 text-sm border rounded p-2 bg-gray-50">
                                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{att.filename}</p>
                                    <p className="text-xs text-gray-500">{formatSize(att.size)}</p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadProcessedAttachment(att.id, att.filename)}
                                    disabled={downloadingAttachment === att.id}
                                    className="shrink-0"
                                  >
                                    {downloadingAttachment === att.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                    ) : (
                                      <>
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                      </>
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full hidden md:flex items-center justify-center">
              <CardContent className="text-center">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Select an email to view</p>
                <p className="text-sm text-gray-500 mt-2">
                  Click on an email from the list to see its contents
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyMailboxPage
