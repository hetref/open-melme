"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Paperclip, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/**
 * ComposeDialog - New email composition
 */
export function ComposeDialog({ open, onOpenChange, mailbox, aliases, aliasesLoading = false, onEmailSent }) {
  const [formData, setFormData] = useState({
    aliasId: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    text: '', // TEXT ONLY
  })

  const [attachments, setAttachments] = useState([])
  const [sending, setSending] = useState(false)
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [uploadId] = useState(() => crypto.randomUUID()) // Temp ID for attachment uploads

  const fileInputRef = useRef(null)

  // Update aliasId when aliases change or dialog opens
  useEffect(() => {
    if (open && aliases && aliases.length > 0 && !formData.aliasId) {
      setFormData(prev => ({
        ...prev,
        aliasId: aliases[0].id
      }))
    }
  }, [open, aliases, formData.aliasId])

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
      aliasId: aliases?.[0]?.id || '',
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      text: '',
    })
    setAttachments([])
    setShowCc(false)
    setShowBcc(false)
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Validate total attachments
    if (attachments.length + files.length > 10) {
      toast.error('Maximum 10 attachments per email')
      return
    }

    // Store files locally without uploading
    const newAttachments = files.map((file) => ({
      file, // Store the actual File object
      filename: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    }))

    setAttachments((prev) => [...prev, ...newAttachments])
    toast.success(`Added ${files.length} attachment(s)`)

    // Clear file input
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
    // Validate
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

    // Check if selected alias is active
    const selectedAlias = aliases?.find(a => a.id === formData.aliasId)
    if (selectedAlias && !selectedAlias.isActive) {
      toast.error('Cannot send from an inactive email alias. Please activate it first.')
      return
    }

    setSending(true)

    try {
      // Upload attachments first if any
      let attachmentKeys = []

      if (attachments.length > 0) {
        toast.info('Uploading attachments...')

        for (const attachment of attachments) {
          const formData = new FormData()
          formData.append('file', attachment.file)
          formData.append('uploadId', uploadId)

          const response = await fetch('/api/mailbox/attachments/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to upload attachment')
          }

          const data = await response.json()
          attachmentKeys.push(data.attachment.s3Key)
        }
      }

      // Send email
      toast.info('Sending email...')
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
          attachmentKeys: attachmentKeys,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a domain verification error
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

      toast.success('Email sent successfully!')
      resetForm()
      onOpenChange(false)

      if (onEmailSent) {
        onEmailSent()
      }

      // Trigger custom event for real-time updates
      const event = new CustomEvent('emailSent')
      window.dispatchEvent(event)
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error(error.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const selectedAlias = aliases?.find((a) => a.id === formData.aliasId)
  const fromAddress = selectedAlias
    ? `${selectedAlias.localPart}@${selectedAlias.domain?.fullDomain}`
    : ''

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose New Email</DialogTitle>
          <DialogDescription>
            Send a new email from your mailbox
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* From */}
          <div className="space-y-2">
            <Label htmlFor="from">From *</Label>
            {aliasesLoading ? (
              <div className="px-3 py-2 border border-input rounded-md bg-muted/40 text-muted-foreground text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading email addresses...
              </div>
            ) : !aliases || aliases.length === 0 ? (
              <div className="px-3 py-2 border border-yellow-300 rounded-md bg-yellow-50 text-yellow-800 text-sm dark:bg-yellow-950/40 dark:text-yellow-200">
                No email aliases available. Please assign an alias to this mailbox first.
              </div>
            ) : (
              <>
                <select
                  id="from"
                  value={formData.aliasId}
                  onChange={(e) => setFormData({ ...formData, aliasId: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  disabled={sending}
                >
                  {aliases.map((alias) => (
                    <option key={alias.id} value={alias.id}>
                      {alias.localPart}@{alias.domain?.fullDomain} {!alias.isActive ? '(INACTIVE)' : ''}
                    </option>
                  ))}
                </select>
                {(() => {
                  const selectedAlias = aliases.find(a => a.id === formData.aliasId)
                  return selectedAlias && !selectedAlias.isActive ? (
                    <div className="mt-2 px-3 py-2 border border-orange-300 rounded-md bg-orange-50 text-orange-800 text-sm dark:bg-orange-950/40 dark:text-orange-200">
                      ⚠️ This email alias is inactive. You won't be able to send emails from this address until it's activated.
                    </div>
                  ) : null
                })()}
              </>
            )}
          </div>

          {/* To */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="to">To *</Label>
              <div className="flex gap-2 text-sm">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-foreground/80 hover:text-foreground hover:underline"
                  >
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="text-foreground/80 hover:text-foreground hover:underline"
                  >
                    Bcc
                  </button>
                )}
              </div>
            </div>
            <Input
              id="to"
              type="text"
              placeholder="recipient@example.com, another@example.com"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              disabled={sending}
            />
          </div>

          {/* Cc */}
          {showCc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cc">Cc</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCc(false)
                    setFormData({ ...formData, cc: '' })
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Input
                id="cc"
                type="text"
                placeholder="cc@example.com"
                value={formData.cc}
                onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                disabled={sending}
              />
            </div>
          )}

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
              className="w-full min-h-50 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring dark:bg-input/30"
              placeholder="Type your message here..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              disabled={sending}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attachments</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || attachments.length >= 10}
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
              Maximum 10 files, 10MB total. Each file max 10MB.
            </p>
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
              disabled={sending || !formData.aliasId || !aliases || aliases.length === 0}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
