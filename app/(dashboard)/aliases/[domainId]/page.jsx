"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit2, Power, PowerOff, ArrowLeft, Mail, RefreshCw, AlertCircle, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { AliasDeletionModal } from '@/components/AliasDeletionModal'
import { authClient } from '@/lib/auth-client'

const personalEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildInitialAliasFormData(defaultPersonalEmail = '') {
  return {
    localPart: '',
    forwardTo: defaultPersonalEmail,
    mode: 'forward', // 'forward' or 'mailbox' or 'createMailbox'
    mailboxId: '',
    mailboxName: '',
    senderName: 'Melme',
    personalEmail: defaultPersonalEmail,
    mailboxPassword: '',
    confirmMailboxPassword: '',
  }
}

const DomainAliasesPage = () => {
  const params = useParams()
  const router = useRouter()
  const domainId = params.domainId

  const { data: session } = authClient.useSession()

  const [domain, setDomain] = useState(null)
  const [aliases, setAliases] = useState([])
  const [mailboxes, setMailboxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingAlias, setEditingAlias] = useState(null)
  const [deletingAlias, setDeletingAlias] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRechecking, setIsRechecking] = useState(false)
  const [mailboxNameTouched, setMailboxNameTouched] = useState(false)

  const [formData, setFormData] = useState(() => buildInitialAliasFormData())

  useEffect(() => {
    if (session?.user?.email && !formData.personalEmail) {
      setFormData((prev) => ({
        ...prev,
        personalEmail: session.user.email,
        forwardTo: prev.mode === 'forward' && !prev.forwardTo ? session.user.email : prev.forwardTo,
      }))
    }
  }, [session?.user?.email, formData.personalEmail])

  useEffect(() => {
    if (domainId) {
      fetchAliases()
      fetchMailboxes()
    }
  }, [domainId])

  const fetchAliases = async () => {
    try {
      const response = await fetch(`/api/domains/${domainId}/aliases`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Domain not found')
          router.push('/aliases')
          return
        }
        throw new Error('Failed to fetch aliases')
      }
      const data = await response.json()
      setDomain(data.domain)
      setAliases(data.aliases)
    } catch (error) {
      console.error('Error fetching aliases:', error)
      toast.error('Failed to load aliases')
    } finally {
      setLoading(false)
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

  const handleCreateAlias = async (e) => {
    e.preventDefault()

    if (!formData.localPart.trim()) {
      toast.error('Local part is required')
      return
    }

    // Check if alias already exists
    const aliasExists = aliases.some(
      a => a.localPart.toLowerCase() === formData.localPart.trim().toLowerCase()
    )
    if (aliasExists) {
      toast.error('An alias with this name already exists for this domain')
      return
    }

    if (formData.mode === 'forward' && !formData.forwardTo.trim()) {
      toast.error('Forward to email is required for forward mode')
      return
    }

    if (formData.mode === 'mailbox' && !formData.mailboxId) {
      toast.error('Please select a mailbox')
      return
    }

    const normalizedForwardTo = formData.mode === 'forward'
      ? (formData.forwardTo.trim() || '')
      : ''

    if (formData.mode !== 'forward' && !formData.personalEmail.trim()) {
      toast.error('Personal email is required')
      return
    }

    const normalizedPersonalEmail = formData.mode === 'forward'
      ? normalizedForwardTo
      : formData.personalEmail.trim().toLowerCase()

    if (!personalEmailRegex.test(normalizedPersonalEmail)) {
      toast.error(formData.mode === 'forward' ? 'Forward to email is invalid' : 'Personal email is invalid')
      return
    }

    if (formData.mode === 'createMailbox') {
      if (!formData.mailboxName.trim()) {
        toast.error('Mailbox name is required')
        return
      }

      if (!formData.senderName.trim()) {
        toast.error('Sender name is required')
        return
      }

      if (!formData.mailboxPassword || !formData.confirmMailboxPassword) {
        toast.error('Mailbox password and confirm password are required')
        return
      }

      if (formData.mailboxPassword.length < 8) {
        toast.error('Mailbox password must be at least 8 characters')
        return
      }

      if (formData.mailboxPassword !== formData.confirmMailboxPassword) {
        toast.error('Mailbox passwords do not match')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const body = {
        domainId,
        localPart: formData.localPart.trim(),
        mode: formData.mode,
        personalEmail: normalizedPersonalEmail,
      }

      if (formData.mode === 'forward') {
        body.forwardTo = normalizedForwardTo
      } else if (formData.mode === 'mailbox') {
        body.mailboxId = formData.mailboxId
      } else {
        body.createMailbox = {
          name: formData.mailboxName.trim(),
          senderName: formData.senderName.trim(),
          password: formData.mailboxPassword,
          confirmPassword: formData.confirmMailboxPassword,
        }
      }

      const response = await fetch('/api/aliases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create alias')
      }

      if (data.warning) {
        toast.warning(data.warning)
      }

      toast.success('Alias created successfully!')
      setIsCreateDialogOpen(false)
      setFormData(buildInitialAliasFormData(session?.user?.email || ''))
      setMailboxNameTouched(false)
      fetchAliases()
    } catch (error) {
      console.error('Error creating alias:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateAlias = async (e) => {
    e.preventDefault()

    if (editingAlias.mode === 'forward' && !formData.forwardTo.trim()) {
      toast.error('Forward to email is required')
      return
    }

    if (editingAlias.mode === 'mailbox' && !formData.mailboxId) {
      toast.error('Please select a mailbox')
      return
    }

    setIsSubmitting(true)

    try {
      const body = {}

      if (editingAlias.mode === 'forward') {
        body.forwardTo = formData.forwardTo.trim()
      } else {
        body.mailboxId = formData.mailboxId
      }

      const response = await fetch(`/api/aliases/${editingAlias.id}`, {
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
      setEditingAlias(null)
      setFormData({ localPart: '', forwardTo: '', mode: 'forward', mailboxId: '' })
      fetchAliases()
    } catch (error) {
      console.error('Error updating alias:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (alias) => {
    try {
      const response = await fetch(`/api/aliases/${alias.id}`, {
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
      fetchAliases()
    } catch (error) {
      console.error('Error toggling alias status:', error)
      toast.error(error.message)
    }
  }

  const handleDeleteAlias = async (alias) => {
    // Open the deletion modal
    setDeletingAlias(alias)
    setIsDeleteDialogOpen(true)
  }

  const handleDeletionSuccess = () => {
    fetchAliases()
  }

  const openEditDialog = (alias) => {
    setEditingAlias(alias)
    setFormData({
      ...buildInitialAliasFormData(session?.user?.email || ''),
      localPart: alias.localPart,
      forwardTo: alias.forwardTo || '',
      mode: alias.mode,
      mailboxId: alias.mailboxId || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleRecheckDomain = async () => {
    setIsRechecking(true)

    try {
      const response = await fetch(`/api/domains/${domainId}/recheck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to recheck domain')
      }

      if (data.pendingEmailsProcessed) {
        toast.success(data.message || `Processed ${data.processedCount} pending emails!`)
      } else {
        if (data.newStatus === 'verified') {
          toast.success('Domain is connected and verified!')
        } else {
          toast.warning('Domain is still disconnected. Please verify your DNS records.')
        }
      }

      // Refresh data
      fetchAliases()
    } catch (error) {
      console.error('Error rechecking domain:', error)
      toast.error(error.message)
    } finally {
      setIsRechecking(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-4 text-foreground-dim">Loading aliases...</p>
        </div>
      </div>
    )
  }

  if (!domain) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-foreground mb-2">Domain not found</h2>
          <button
            type="button"
            onClick={() => router.push('/aliases')}
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
        href="/aliases"
        className="inline-flex items-center gap-2 text-foreground-dim hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back to Domains</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-mono text-2xl lg:text-3xl font-bold text-foreground mb-2">
            {domain.fullDomain}
          </h1>
          <p className="text-foreground-dim">
            Manage email aliases for this domain
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={18} />
              Create Alias
            </button>
          </DialogTrigger>
          <DialogContent className="bg-surface border border-border rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New Alias</DialogTitle>
              <DialogDescription>
                Create a new email alias for {domain.fullDomain}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAlias} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="localPart">Local Part</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="localPart"
                    type="text"
                    placeholder="support"
                    value={formData.localPart}
                    onChange={(e) => {
                      const nextLocalPart = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        localPart: nextLocalPart,
                        mailboxName: mailboxNameTouched ? prev.mailboxName : nextLocalPart,
                      }))
                    }}
                    disabled={isSubmitting}
                    autoComplete="off"
                    className="flex-1"
                  />
                  <span className="text-gray-500 font-mono text-sm">
                    @{domain.fullDomain}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Use lowercase letters, numbers, dots, hyphens, or underscores
                </p>
              </div>

              <div className="space-y-2">
                <Label>Alias Mode</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="forward"
                      checked={formData.mode === 'forward'}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        mode: e.target.value,
                        forwardTo: prev.forwardTo || prev.personalEmail,
                      }))}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm">Forward to email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="mailbox"
                      checked={formData.mode === 'mailbox'}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm">Store in mailbox</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="createMailbox"
                      checked={formData.mode === 'createMailbox'}
                      onChange={(e) => {
                        const nextMode = e.target.value
                        setFormData((prev) => ({
                          ...prev,
                          mode: nextMode,
                          mailboxName: (!mailboxNameTouched && !prev.mailboxName)
                            ? prev.localPart
                            : prev.mailboxName,
                        }))
                      }}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm">Create mailbox</span>
                  </label>
                </div>
              </div>

              {formData.mode !== 'forward' && (
                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Personal Email</Label>
                  <Input
                    id="personalEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.personalEmail}
                    onChange={(e) => {
                      const nextPersonalEmail = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        personalEmail: nextPersonalEmail,
                      }))
                    }}
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                  <p className="text-sm text-gray-500">
                    Used as your primary contact email for this alias setup.
                  </p>
                </div>
              )}

              {formData.mode === 'forward' ? (
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
                    Welcome email and all future messages will be sent here
                  </p>
                </div>
              ) : formData.mode === 'mailbox' ? (
                <div className="space-y-2">
                  <Label htmlFor="mailboxId">Select Mailbox</Label>
                  {mailboxes.length === 0 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      No mailboxes available for this domain. Create a mailbox first.
                    </div>
                  ) : (
                    <select
                      id="mailboxId"
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
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mailboxName">Mailbox Name</Label>
                    <Input
                      id="mailboxName"
                      type="text"
                      placeholder="Support"
                      value={formData.mailboxName}
                      onChange={(e) => {
                        setMailboxNameTouched(true)
                        setFormData({ ...formData, mailboxName: e.target.value })
                      }}
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                    <p className="text-sm text-gray-500">
                      Defaults to alias name and can be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderName">Sender Name</Label>
                    <Input
                      id="senderName"
                      type="text"
                      placeholder="Melme"
                      value={formData.senderName}
                      onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mailboxPassword">Mailbox Password</Label>
                    <Input
                      id="mailboxPassword"
                      type="password"
                      placeholder="At least 8 characters"
                      value={formData.mailboxPassword}
                      onChange={(e) => setFormData({ ...formData, mailboxPassword: e.target.value })}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmMailboxPassword">Confirm Password</Label>
                    <Input
                      id="confirmMailboxPassword"
                      type="password"
                      placeholder="Confirm mailbox password"
                      value={formData.confirmMailboxPassword}
                      onChange={(e) => setFormData({ ...formData, confirmMailboxPassword: e.target.value })}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                    />
                  </div>

                  <p className="text-sm text-gray-500">
                    Mailbox access details will be sent to the personal email above.
                  </p>
                </div>
              )}

              {/* Domain Status Info */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground-dim">Status:</span>
                  <Badge
                    variant={domain.verificationStatus === 'verified' ? 'default' : 'secondary'}
                    className={
                      domain.verificationStatus === 'verified'
                        ? 'bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/10'
                        : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/10'
                    }
                  >
                    {domain.verificationStatus === 'verified' ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="text-sm text-foreground-dim">
                  Last checked: {formatDate(domain.lastCheckedAt)}
                </div>
                {domain.pendingEmailCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{domain.pendingEmailCount} pending emails</span>
                  </div>
                )}
              </div>

              {/* Warning Message */}
              {domain.verificationStatus === 'pending' && domain.pendingEmailCount > 0 && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-700">
                    Emails were paused because the domain connection was lost.
                    Recheck the domain to resume delivery and process pending emails.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setFormData(buildInitialAliasFormData(session?.user?.email || ''))
                    setMailboxNameTouched(false)
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-raised transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Alias'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {aliases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Aliases Yet</h3>
          <p className="text-foreground-dim mb-6 max-w-sm mx-auto">
            Create your first email alias to start receiving emails.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Create Alias
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {aliases.map((alias, index) => (
            <motion.div
              key={alias.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link href={`/aliases/${domainId}/${alias.id}`} className="group">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-mono text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {alias.localPart}@{domain.fullDomain}
                      </h3>
                      {alias.mode === 'mailbox' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Inbox size={10} />
                          Mailbox
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${alias.isActive
                            ? 'bg-[#22c55e]/10 text-[#22c55e]'
                            : 'bg-muted/20 text-muted'
                          }`}
                      >
                        {alias.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </Link>

                  <p className="text-sm text-foreground-dim mb-3">
                    {alias.mode === 'forward'
                      ? <>Forwards to: <span className="text-foreground">{alias.forwardTo}</span></>
                      : <>Stored in mailbox: <span className="text-foreground">{alias.mailbox?.name || 'Unknown'}</span></>
                    }
                  </p>

                  <div className="flex items-center gap-2 text-sm text-foreground-dim">
                    <Mail size={14} />
                    <span>{alias.emailCount} emails received</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(alias)}
                    className="p-2.5 rounded-lg border border-border hover:bg-surface-raised hover:border-primary/30 transition-colors group"
                    title={alias.isActive ? 'Disable' : 'Enable'}
                  >
                    {alias.isActive ? (
                      <PowerOff size={16} className="text-muted group-hover:text-foreground" />
                    ) : (
                      <Power size={16} className="text-muted group-hover:text-foreground" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditDialog(alias)}
                    className="p-2.5 rounded-lg border border-border hover:bg-surface-raised hover:border-primary/30 transition-colors group"
                    title="Edit"
                  >
                    <Edit2 size={16} className="text-muted group-hover:text-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAlias(alias)}
                    className="p-2.5 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 transition-colors group"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-muted group-hover:text-destructive" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-surface border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Alias</DialogTitle>
            <DialogDescription>
              Update {editingAlias?.mode === 'forward' ? 'forwarding email' : 'mailbox'} for {editingAlias?.localPart}@{domain.fullDomain}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAlias} className="space-y-4 mt-4">
            {editingAlias?.mode === 'forward' ? (
              <div className="space-y-2">
                <Label htmlFor="editForwardTo">Forward To Email</Label>
                <Input
                  id="editForwardTo"
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
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingAlias(null)
                  setFormData(buildInitialAliasFormData(session?.user?.email || ''))
                }}
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
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeletingAlias(null)
        }}
        alias={deletingAlias ? {
          id: deletingAlias.id,
          localPart: deletingAlias.localPart,
          mode: deletingAlias.mode,
          domainName: domain.fullDomain,
        } : null}
        onSuccess={handleDeletionSuccess}
      />
    </div>
  )
}

export default DomainAliasesPage
