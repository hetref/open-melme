"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Paperclip, Send, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

/**
 * ForwardDialog - Forward an email or conversation
 */
export function ForwardDialog({
  open,
  onOpenChange,
  mailbox,
  aliases,
  originalEmail,
  conversationEmails = [],
  onEmailSent
}) {
  const [formData, setFormData] = useState({
    aliasId: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    text: '',
    html: '',
    includeConversation: true,
  })

  const [attachments, setAttachments] = useState([])
  const [originalAttachments, setOriginalAttachments] = useState([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [sending, setSending] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [uploadId] = useState(() => crypto.randomUUID())

  const fileInputRef = useRef(null)

  // Fetch original attachments
  const fetchOriginalAttachments = async () => {
    if (!originalEmail || !open) return

    setLoadingAttachments(true)
    try {
      // Collect all emails to check for attachments
      const emailsToCheck = conversationEmails && conversationEmails.length > 1
        ? conversationEmails
        : [originalEmail]

      // Get all attachments from all emails
      const allAttachments = []
      let hasUnprocessedAttachments = false

      for (const email of emailsToCheck) {
        // Check if email has attachments that need processing
        if (email.attachmentsCount > 0 && email.attachmentsStatus === 'not_processed') {
          hasUnprocessedAttachments = true
        }

        if (email.processedAttachments && email.processedAttachments.length > 0) {
          // Map attachments with email context
          const emailAttachments = email.processedAttachments.map(att => ({
            ...att,
            emailId: email.id,
            emailSubject: email.subject,
          }))
          allAttachments.push(...emailAttachments)
        }
      }

      setOriginalAttachments(allAttachments)

      // Show warning if there are unprocessed attachments
      if (hasUnprocessedAttachments) {
        toast.warning('Some attachments need to be processed before forwarding. Please process them first.')
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
      toast.error('Failed to load original attachments')
    } finally {
      setLoadingAttachments(false)
    }
  }

  // Initialize form when original email changes
  useEffect(() => {
    if (!originalEmail || !open) return

    // Fetch attachments
    fetchOriginalAttachments()

    // Find matching alias - prefer the alias from the original email
    const matchingAlias = aliases?.find(
      (a) => originalEmail.toEmail.includes(`${a.localPart}@${a.domain?.fullDomain}`)
    ) || aliases?.find(a => a.isActive) || aliases?.[0]

    // Build forward subject
    const forwardSubject = originalEmail.subject?.startsWith('Fwd:')
      ? originalEmail.subject
      : `Fwd: ${originalEmail.subject || '(No Subject)'}`

    const stripHtml = (html) => {
      if (!html) return ''
      return html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?p\b[^>]*>/gi, '\n')
        .replace(/<\/?div\b[^>]*>/gi, '\n')
        .replace(/<\/?li\b[^>]*>/gi, '\n- ')
        .replace(/<\/?ul\b[^>]*>/gi, '\n')
        .replace(/<\/?ol\b[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }

    const getEmailText = (email) => {
      return (
        email.body?.text ||
        stripHtml(email.body?.safeHtmlNoImages || email.body?.safeHtmlWithImages || '') ||
        '(No text content)'
      )
    }

    const getEmailHtml = (email) => {
      return email.body?.safeHtmlWithImages || email.body?.safeHtmlNoImages || ''
    }

    const buildForwardTextBlock = (email) => {
      return [
        `From: ${email.fromEmail}`,
        `Date: ${formatDate(email.createdAt)}`,
        `Subject: ${email.subject || '(No Subject)'}`,
        `To: ${email.toEmail}`,
        '',
        getEmailText(email),
      ].join('\n')
    }

    const buildForwardHtmlBlock = (email) => {
      const htmlContent = getEmailHtml(email)
      const plainFallback = getEmailText(email)

      return `
<div style="margin-top:12px; padding:12px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc;">
  <div style="font-size:12px; color:#334155; line-height:1.5;">
    <div><strong>From:</strong> ${email.fromEmail}</div>
    <div><strong>Date:</strong> ${formatDate(email.createdAt)}</div>
    <div><strong>Subject:</strong> ${email.subject || '(No Subject)'}</div>
    <div><strong>To:</strong> ${email.toEmail}</div>
  </div>
  <div style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:12px; color:#0f172a;">
    ${htmlContent || `<pre style="white-space:pre-wrap; font-family:inherit; margin:0;">${plainFallback}</pre>`}
  </div>
</div>
      `.trim()
    }

    // Build forward body with original email content
    let forwardText = ''
    let forwardHtml = ''

    if (conversationEmails && conversationEmails.length > 1) {
      // Multiple emails in conversation - include all
      forwardText = `\n\n---------- Forwarded conversation ----------\n\n`
      forwardHtml = `<div style="margin-top:12px; font-size:13px; color:#64748b;">---------- Forwarded conversation ----------</div>`

      conversationEmails.forEach((email, index) => {
        forwardText += `${buildForwardTextBlock(email)}\n\n`
        forwardHtml += buildForwardHtmlBlock(email)

        if (index < conversationEmails.length - 1) {
          forwardText += `---\n\n`
          forwardHtml += `<div style="margin:12px 0; border-top:1px dashed #cbd5f5;"></div>`
        }
      })
    } else {
      // Single email
      const sourceEmail = conversationEmails?.[0] || originalEmail
      forwardText = `\n\n---------- Forwarded message ---------\n`
      forwardText += `${buildForwardTextBlock(sourceEmail)}\n`
      forwardHtml = `<div style="margin-top:12px; font-size:13px; color:#64748b;">---------- Forwarded message ---------</div>`
      forwardHtml += buildForwardHtmlBlock(sourceEmail)
    }

    setFormData({
      aliasId: matchingAlias?.id || '',
      to: '',
      cc: '',
      bcc: '',
      subject: forwardSubject,
      text: forwardText,
      html: forwardHtml,
      includeConversation: conversationEmails && conversationEmails.length > 1,
    })
  }, [originalEmail, conversationEmails, aliases, open])

  const handleClose = () => {
    if (sending) {
      toast.error('Cannot close while sending')
      return
    }
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setFormData({
      aliasId: '',
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      text: '',
      html: '',
      includeConversation: true,
    })
    setAttachments([])
    setOriginalAttachments([])
    setShowBcc(false)
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Check total attachment count including original attachments
    const totalAttachments = originalAttachments.length + attachments.length + files.length
    if (totalAttachments > 10) {
      toast.error(`Maximum 10 attachments total. You already have ${originalAttachments.length + attachments.length} attachment(s).`)
      return
    }

    const newAttachments = files.map((file) => ({
      file,
      filename: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    }))

    setAttachments((prev) => [...prev, ...newAttachments])
    toast.success(`Added ${files.length} attachment(s)`)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
    toast.success('Attachment removed')
  }

  const parseEmailList = (str) => {
    return str
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => e && e.includes('@'))
  }

  const handleSend = async () => {
    const toEmails = parseEmailList(formData.to)
    const ccEmails = parseEmailList(formData.cc)
    const bccEmails = parseEmailList(formData.bcc)

    if (toEmails.length === 0 && ccEmails.length === 0 && bccEmails.length === 0) {
      toast.error('At least one recipient is required')
      return
    }

    if (!formData.subject.trim()) {
      toast.error('Subject is required')
      return
    }

    if (!formData.text.trim()) {
      toast.error('Email body is required')
      return
    }

    if (!formData.aliasId) {
      toast.error('Please select a from address')
      return
    }

    const selectedAlias = aliases?.find(a => a.id === formData.aliasId)
    if (selectedAlias && !selectedAlias.isActive) {
      toast.error('Cannot send from an inactive email alias. Please activate it first.')
      return
    }

    setSending(true)

    try {
      // Upload new attachments first if any
      let attachmentKeys = []

      if (attachments.length > 0) {
        toast.info('Uploading attachments...')

        for (const attachment of attachments) {
          const formDataToSend = new FormData()
          formDataToSend.append('file', attachment.file)
          formDataToSend.append('uploadId', uploadId)

          const response = await fetch('/api/mailbox/attachments/upload', {
            method: 'POST',
            body: formDataToSend,
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to upload attachment')
          }

          const data = await response.json()
          attachmentKeys.push(data.attachment.s3Key)
        }
      }

      // Collect original attachment IDs to forward
      const originalAttachmentIds = originalAttachments.map(att => att.id)

      // Send forwarded email
      toast.info('Forwarding email...')
      const response = await fetch('/api/mailbox/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mailboxId: mailbox.id,
          aliasId: formData.aliasId,
          to: toEmails,
          cc: ccEmails,
          bcc: bccEmails,
          subject: formData.subject,
          text: formData.text,
          html: formData.html,
          attachmentKeys: attachmentKeys,
          forwardedFromEmailLogId: originalEmail?.id,
          forwardConversation: formData.includeConversation && conversationEmails?.length > 1,
          forwardedAttachmentIds: originalAttachmentIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.verificationRequired) {
          const domainStatus = data.domainStatus
          let errorMessage = data.error

          if (domainStatus) {
            errorMessage += '\n\n'
            if (domainStatus.dkimStatus !== 'verified') {
              errorMessage += '❌ DKIM not verified (required for domain ownership)\n'
            }
            if (domainStatus.mxStatus !== 'verified') {
              errorMessage += '❌ MX not verified (required for email receiving)\n'
            }
            errorMessage += '\nPlease configure your DNS records in the Domains section.'
          }

          toast.error(errorMessage, { duration: 10000 })
          throw new Error(data.error)
        }

        throw new Error(data.error || 'Failed to send email')
      }

      toast.success('Email forwarded successfully!')
      resetForm()
      onOpenChange(false)

      if (onEmailSent) {
        onEmailSent()
      }

      // Trigger custom event for real-time updates
      const event = new CustomEvent('emailSent')
      window.dispatchEvent(event)
    } catch (error) {
      console.error('Error forwarding email:', error)
      toast.error(error.message || 'Failed to forward email')
    } finally {
      setSending(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
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

  const hasConversation = conversationEmails && conversationEmails.length > 1

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Forward Email</DialogTitle>
          <DialogDescription>
            {hasConversation
              ? `Forwarding conversation with ${conversationEmails.length} messages`
              : `Forwarding email from ${originalEmail?.fromEmail}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Email Preview */}
          {originalEmail && (
            <div className="bg-muted/40 border border-input rounded p-3 space-y-1 text-sm text-foreground">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {hasConversation ? 'Forwarding Conversation' : 'Forwarding Message'}
                </span>
              </div>
              {hasConversation ? (
                <div>
                  <span className="font-medium">Conversation:</span> {conversationEmails.length} messages
                </div>
              ) : (
                <>
                  <div><span className="font-medium">From:</span> {originalEmail.fromEmail}</div>
                  <div><span className="font-medium">Date:</span> {formatDate(originalEmail.createdAt)}</div>
                  <div><span className="font-medium">Subject:</span> {originalEmail.subject || '(No Subject)'}</div>
                </>
              )}
            </div>
          )}

          {/* From */}
          <div className="space-y-2">
            <Label htmlFor="from">From *</Label>
            <select
              id="from"
              value={formData.aliasId}
              onChange={(e) => setFormData({ ...formData, aliasId: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              disabled={sending}
            >
              {aliases?.map((alias) => {
                const domain = alias.domain?.fullDomain || alias.domain?.domain || '';
                return (
                  <option key={alias.id} value={alias.id}>
                    {alias.localPart}@{domain} {!alias.isActive ? '(INACTIVE)' : ''}
                  </option>
                );
              })}
            </select>
            {(() => {
              const selectedAlias = aliases?.find(a => a.id === formData.aliasId)
              return selectedAlias && !selectedAlias.isActive ? (
                <div className="mt-2 px-3 py-2 border border-orange-300 rounded-md bg-orange-50 text-orange-800 text-sm dark:bg-orange-950/40 dark:text-orange-200">
                  ⚠️ This email alias is inactive. You won't be able to send emails from this address until it's activated.
                </div>
              ) : null
            })()}
          </div>

          {/* To */}
          <div className="space-y-2">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="text"
              placeholder="recipient@example.com"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              disabled={sending}
            />
          </div>

          {/* Cc */}
          <div className="space-y-2">
            <Label htmlFor="cc">Cc</Label>
            <Input
              id="cc"
              type="text"
              placeholder="cc@example.com"
              value={formData.cc}
              onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
              disabled={sending}
            />
          </div>

          {/* Bcc */}
          {showBcc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bcc">Bcc</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowBcc(false)
                    setFormData({ ...formData, bcc: '' })
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Input
                id="bcc"
                type="text"
                placeholder="bcc@example.com"
                value={formData.bcc}
                onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                disabled={sending}
              />
            </div>
          )}

          {!showBcc && (
            <button
              type="button"
              onClick={() => setShowBcc(true)}
              className="text-sm text-foreground/80 hover:text-foreground hover:underline"
            >
              Add Bcc
            </button>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Email subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              disabled={sending}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message *</Label>
            <textarea
              id="body"
              className="w-full min-h-50 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring font-mono text-sm dark:bg-input/30"
              placeholder="Add your message here..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              The forwarded email content is included below your message
            </p>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            {/* Original Attachments from Forwarded Email */}
            {originalAttachments.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Original Attachments ({originalAttachments.length})
                </Label>
                {loadingAttachments ? (
                  <div className="flex items-center justify-center p-4 border border-input rounded bg-muted/40">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading attachments...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {originalAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 border border-blue-200 rounded bg-blue-50 dark:bg-blue-950/40 dark:border-blue-900"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-2">
                            <Paperclip className="w-3 h-3 text-blue-600" />
                            {att.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatSize(att.size)}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-100">
                          Will be forwarded
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  These attachments from the original email will be included and copied to the forwarded message.
                </p>
              </div>
            )}

            {/* New Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Additional Attachments</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || (originalAttachments.length + attachments.length) >= 10}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Add Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border border-input rounded bg-muted/40"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.filename}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(att.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                        disabled={sending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Maximum 10 files total ({originalAttachments.length + attachments.length}/10 used), 10MB each.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Forwarding...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Forward Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
