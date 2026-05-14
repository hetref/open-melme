"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
      return <p className="text-xs text-gray-500">No {type} yet</p>
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
          <span
            className="text-xs text-gray-500 cursor-pointer select-none hover:text-gray-700"
            role="button"
            tabIndex={0}
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
          </span>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mailboxes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mailboxes</h1>
            <p className="text-gray-600 mt-2">
              Secure mailboxes for receiving and storing emails
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by mailbox name, alias, or tag"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
            autoComplete="off"
          />
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Mailbox Security</p>
              <p className="text-sm text-blue-700 mt-1">
                • Mailbox access requires a separate password<br />
                • Mailbox sessions expire after 1 hour<br />
                • Exiting mailbox logs you out immediately
              </p>
            </div>
          </div>
        </div>

        {/* Mailboxes List */}
        {mailboxes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No mailboxes yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Create aliases first. Mailboxes are created from alias flows so each mailbox always has at least one alias.
              </p>
              <Button onClick={() => router.push('/aliases')}>
                Go to Aliases
              </Button>
            </CardContent>
          </Card>
        ) : filteredMailboxes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No mailboxes match your search</h3>
              <p className="text-gray-600 text-center max-w-md">
                Try another keyword using mailbox name, alias, or tag.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMailboxes.map((mailbox) => {
              const aliasItems = (mailbox.aliases || []).map(toAliasLabel)
              const tagItems = mailbox.tags || []

              return (
                <Card key={mailbox.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Mail className="w-10 h-10 text-blue-600" />
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
                    <CardTitle className="text-lg mt-2">
                      {mailbox.name}
                    </CardTitle>
                    <CardDescription>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 break-all">
                          {mailbox.personalEmail || 'No personal email set'}
                        </div>
                        {mailbox.description && (
                          <div className="text-xs text-gray-500 line-clamp-2">{mailbox.description}</div>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-xs text-gray-600">Aliases</span>
                        {renderPreviewItems(aliasItems, 'aliases', mailbox.name)}
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs text-gray-600">Tags</span>
                        {renderPreviewItems(tagItems, 'tags', mailbox.name)}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Aliases:</span>
                        <Badge variant="outline">
                          {mailbox._count.aliases}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Active Sessions:</span>
                        <Badge variant="outline">
                          {mailbox._count.sessions}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {formatDate(mailbox.createdAt)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/mailboxes/${mailbox.id}`)}
                        >
                          Manage
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push('/my-mailbox')}
                        >
                          Access
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog
        open={overflowDialog.open}
        onOpenChange={(open) =>
          setOverflowDialog((prev) => ({
            ...prev,
            open,
          }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{overflowDialog.title}</DialogTitle>
            <DialogDescription>{overflowDialog.description}</DialogDescription>
          </DialogHeader>

          {overflowDialog.items.length === 0 ? (
            <p className="text-sm text-gray-500">No items available.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2 max-h-72 overflow-y-auto">
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
