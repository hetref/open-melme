"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Mail, Lock, Search } from 'lucide-react'
import { toast } from 'sonner'

const MAX_PREVIEW_ITEMS = 4

function toAliasLabel(alias) {
  return `${alias.localPart}@${alias.domain?.fullDomain || 'unknown'}`
}

const MailboxesPage = () => {
  const router = useRouter()
  const [mailboxes, setMailboxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [overflowDialog, setOverflowDialog] = useState({
    open: false,
    title: '',
    description: '',
    items: [],
  })

  useEffect(() => {
    fetchMailboxes()
  }, [])

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

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const openOverflow = (title, description, items) => {
    setOverflowDialog({
      open: true,
      title,
      description,
      items,
    })
  }

  const filteredMailboxes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return mailboxes
    }

    return mailboxes.filter((mailbox) => {
      const nameMatch = mailbox.name.toLowerCase().includes(query)
      const tagMatch = (mailbox.tags || []).some((tag) => tag.toLowerCase().includes(query))
      const aliasMatch = (mailbox.aliases || []).some((alias) =>
        toAliasLabel(alias).toLowerCase().includes(query)
      )

      return nameMatch || tagMatch || aliasMatch
    })
  }, [mailboxes, searchQuery])

  const renderPreviewItems = (items, type, mailboxName) => {
    if (!items || items.length === 0) {
      return <p className="text-xs text-muted">No {type} yet</p>
    }

    const visibleItems = items.slice(0, MAX_PREVIEW_ITEMS)
    const hasOverflow = items.length > MAX_PREVIEW_ITEMS

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {visibleItems.map((item) => (
          <Badge key={item} variant="outline" className="truncate text-xs font-normal">
            {item}
          </Badge>
        ))}
        {hasOverflow && (
          <button
            type="button"
            className="cursor-pointer select-none text-xs text-muted transition-colors hover:text-foreground"
            onClick={() =>
              openOverflow(
                `All ${type} for ${mailboxName}`,
                `${items.length} ${type} assigned to this mailbox`,
                items
              )
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openOverflow(
                  `All ${type} for ${mailboxName}`,
                  `${items.length} ${type} assigned to this mailbox`,
                  items
                )
              }
            }}
          >
            ...
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted">Loading mailboxes...</p>
        </div>
      </div>
    )
  }

  const emptyState = mailboxes.length === 0
  const filteredEmptyState = !emptyState && filteredMailboxes.length === 0

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-foreground lg:text-3xl">
          Mailboxes
        </h1>
        <p className="mt-1 text-muted">
          Secure mailboxes for receiving and storing emails
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by mailbox name, alias, or tag"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-12 rounded-xl border-border bg-surface pl-11 text-foreground placeholder:text-muted focus-visible:border-primary/40 focus-visible:ring-primary/20"
            autoComplete="off"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Lock size={18} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Mailbox Security</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Mailbox access requires a separate password. Sessions expire after 1 hour,
              and exiting a mailbox logs you out immediately.
            </p>
          </div>
        </div>
      </motion.div>

      {emptyState ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border border-dashed bg-surface p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Mail size={32} className="text-primary" />
          </div>
          <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground">
            No mailboxes yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Create aliases first. Mailboxes are created from alias flows so each mailbox
            always has at least one alias.
          </p>
          <Button onClick={() => router.push('/aliases')} className="mt-6 rounded-xl px-5">
            Go to Aliases
          </Button>
        </motion.div>
      ) : filteredEmptyState ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border border-dashed bg-surface p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised">
            <Search size={32} className="text-muted" />
          </div>
          <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground">
            No mailboxes match your search
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Try another keyword using mailbox name, alias, or tag.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filteredMailboxes.map((mailbox, index) => {
              const aliasItems = (mailbox.aliases || []).map(toAliasLabel)
              const tagItems = mailbox.tags || []

              return (
                <motion.div
                  key={mailbox.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Mail size={24} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground transition-colors group-hover:text-primary break-all">
                            {mailbox.name}
                          </h3>
                          <Badge
                            variant={mailbox.isActive ? 'default' : 'secondary'}
                            className={
                              mailbox.isActive
                                ? 'rounded-full border-transparent bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/10'
                                : 'rounded-full border-transparent bg-muted/20 text-muted hover:bg-muted/20'
                            }
                          >
                            {mailbox.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="mt-1 break-all text-sm text-muted">
                          {mailbox.personalEmail || 'No personal email set'}
                        </p>
                        {mailbox.description && (
                          <p className="mt-3 line-clamp-2 text-sm text-foreground-dim">
                            {mailbox.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted">Aliases</span>
                      {renderPreviewItems(aliasItems, 'aliases', mailbox.name)}
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted">Tags</span>
                      {renderPreviewItems(tagItems, 'tags', mailbox.name)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                      <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
                        <p className="text-xs text-muted">Aliases</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {mailbox._count.aliases}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
                        <p className="text-xs text-muted">Sessions</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {mailbox._count.sessions}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted">Created {formatDate(mailbox.createdAt)}</p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={() => router.push(`/mailboxes/${mailbox.id}`)}
                      >
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl"
                        onClick={() => router.push('/my-mailbox')}
                      >
                        Access
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog
        open={overflowDialog.open}
        onOpenChange={(open) =>
          setOverflowDialog((prev) => ({
            ...prev,
            open,
          }))
        }
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-display)] text-foreground">
              {overflowDialog.title}
            </DialogTitle>
            <DialogDescription>{overflowDialog.description}</DialogDescription>
          </DialogHeader>

          {overflowDialog.items.length === 0 ? (
            <p className="text-sm text-muted">No items available.</p>
          ) : (
            <div className="mt-2 flex max-h-72 flex-wrap gap-2 overflow-y-auto">
              {overflowDialog.items.map((item) => (
                <Badge key={item} variant="outline" className="font-normal">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MailboxesPage
