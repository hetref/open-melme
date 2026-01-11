"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  AlertCircle,
  ArrowLeft,
  X,
  RefreshCw,
  Download,
  Filter,
  Paperclip,
  ImageIcon,
  Reply,
  ReplyAll,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMailbox } from '../_context/MailboxContext'
import { ReplyDialog } from '@/components/ReplyDialog'

export function EmailListView({ emailType = 'received' }) {
  const { session } = useMailbox()
  const [emails, setEmails] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedEmailDetail, setSelectedEmailDetail] = useState(null)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [emailDetailLoading, setEmailDetailLoading] = useState(false)
  const [isMobilePreview, setIsMobilePreview] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [downloadingAttachment, setDownloadingAttachment] = useState(null)
  const [processingAttachments, setProcessingAttachments] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showImages, setShowImages] = useState(false)
  const [emailView, setEmailView] = useState('html')
  const [aliases, setAliases] = useState([])
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [isReplyAllOpen, setIsReplyAllOpen] = useState(false)

  const [filters, setFilters] = useState({
    query: '',
    from: '',
    aliasId: '',
    hasAttachments: false,
    dateFrom: '',
    dateTo: '',
    status: emailType === 'sent' ? 'sent' : 'received',
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  })

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

  const fetchAliases = async () => {
    try {
      const response = await fetch('/api/aliases')
      if (!response.ok) {
        if (session?.mailbox) {
          const mailboxAlias = createMailboxPrimaryAlias(session.mailbox)
          setAliases([mailboxAlias])
        }
        return
      }

      const data = await response.json()
      let mailboxAliases = data.aliases?.filter(
        (alias) => alias.mailboxId === session?.mailbox?.id && alias.isActive
      ) || []

      if (mailboxAliases.length === 0 && session?.mailbox) {
        mailboxAliases = [createMailboxPrimaryAlias(session.mailbox)]
      }

      setAliases(mailboxAliases)
    } catch (error) {
      console.error('Error fetching aliases:', error)
      if (session?.mailbox) {
        const mailboxAlias = createMailboxPrimaryAlias(session.mailbox)
        setAliases([mailboxAlias])
      }
    }
  }

  const createMailboxPrimaryAlias = (mailbox) => {
    const [localPart, domain] = mailbox.emailAlias.split('@')
    return {
      id: `mailbox-${mailbox.id}`,
      localPart: localPart || 'mailbox',
      mailboxId: mailbox.id,
      domainId: mailbox.domainId,
      isActive: true,
      domain: mailbox.domain ? {
        ...mailbox.domain,
        fullDomain: mailbox.domain.fullDomain || domain
      } : {
        fullDomain: domain,
        domain: domain,
        verificationStatus: 'verified'
      },
      mode: 'mailbox',
      isMailboxPrimary: true
    }
  }

  const fetchEmails = async (page = 1) => {
    setEmailsLoading(true)
    try {
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
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/my-mailbox/emails?${params.toString()}`)

      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
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
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(null)
      setSelectedEmailDetail(null)
      setIsMobilePreview(false)
      return
    }

    setSelectedEmail(email)
    setShowImages(false)
    setEmailView('html')
    fetchEmailDetail(email.id)

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
      status: emailType === 'sent' ? 'sent' : 'received',
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

  const handleDownloadProcessedAttachment = async (attachmentId, filename) => {
    setDownloadingAttachment(attachmentId)
    try {
      const response = await fetch(`/api/my-mailbox/attachments/${attachmentId}/download`)

      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to generate download URL')
      }

      const data = await response.json()

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

      await fetchEmailDetail(selectedEmail.id)
    } catch (error) {
      console.error('Error processing attachments:', error)
      toast.error(error.message || 'Failed to process attachments')
    } finally {
      setProcessingAttachments(false)
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
      case 'sent':
        return <Send className="w-4 h-4 text-blue-600" />
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
      sent: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      failed: 'bg-red-100 text-red-800 hover:bg-red-100',
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    }
    return variants[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }

  const handleReply = () => {
    if (!selectedEmail) return
    setIsReplyOpen(true)
  }

  const handleReplyAll = () => {
    if (!selectedEmail) return
    setIsReplyAllOpen(true)
  }

  const handleEmailSent = () => {
    fetchEmails(pagination.page)
  }

  if (!session) {
    return null
  }

  return (
    <>
      <div className="flex gap-4 h-full">
        {/* Email List */}
        <div className={`${isMobilePreview ? 'hidden md:block' : 'block'} w-full md:w-96 shrink-0`}>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <CardTitle>{emailType === 'sent' ? 'Sent Emails' : 'Inbox'}</CardTitle>
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
                          {emailType === 'sent' ? `To: ${email.toEmail}` : email.fromEmail}
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

        {/* Email Detail - Preview Pane */}
        <div className={`${isMobilePreview ? 'block' : 'hidden md:block'} flex-1`}>
          {selectedEmail ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
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
                      {emailType === 'sent' ? `To: ${selectedEmail.toEmail}` : `From: ${selectedEmail.fromEmail}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {emailType !== 'sent' && selectedEmail.status === 'received' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReply}
                          title="Reply to sender"
                        >
                          <Reply className="w-4 h-4 mr-1" />
                          Reply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReplyAll}
                          title="Reply to all recipients"
                        >
                          <ReplyAll className="w-4 h-4 mr-1" />
                          Reply All
                        </Button>
                      </>
                    )}
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
                      <div><span className="font-medium">From:</span> {selectedEmailDetail.headers?.from || selectedEmailDetail.fromEmail}</div>
                      <div><span className="font-medium">To:</span> {selectedEmailDetail.headers?.to || selectedEmailDetail.toEmail}</div>
                      {selectedEmailDetail.headers?.cc && (
                        <div><span className="font-medium">Cc:</span> {selectedEmailDetail.headers.cc}</div>
                      )}
                      <div><span className="font-medium">Date:</span> {formatDate(selectedEmailDetail.headers?.date || selectedEmailDetail.createdAt)}</div>
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
                          {/* Show Process Attachments button for:
                              1. Received emails that need processing
                              2. Sent emails that need processing (old emails before feature was added) */}
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
                        </div>

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

      {/* Reply Dialog */}
      {session && selectedEmail && emailType !== 'sent' && (
        <>
          <ReplyDialog
            open={isReplyOpen}
            onOpenChange={setIsReplyOpen}
            mailbox={session.mailbox}
            aliases={aliases}
            originalEmail={selectedEmail}
            replyAll={false}
            onEmailSent={handleEmailSent}
          />

          <ReplyDialog
            open={isReplyAllOpen}
            onOpenChange={setIsReplyAllOpen}
            mailbox={session.mailbox}
            aliases={aliases}
            originalEmail={selectedEmail}
            replyAll={true}
            onEmailSent={handleEmailSent}
          />
        </>
      )}
    </>
  )
}
