"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit2, Power, PowerOff, ArrowLeft, Mail, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const DomainAliasesPage = () => {
  const params = useParams()
  const router = useRouter()
  const domainId = params.domainId

  const [domain, setDomain] = useState(null)
  const [aliases, setAliases] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAlias, setEditingAlias] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRechecking, setIsRechecking] = useState(false)

  const [formData, setFormData] = useState({
    localPart: '',
    forwardTo: '',
  })

  useEffect(() => {
    if (domainId) {
      fetchAliases()
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

  const handleCreateAlias = async (e) => {
    e.preventDefault()

    if (!formData.localPart.trim() || !formData.forwardTo.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/aliases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId,
          localPart: formData.localPart.trim(),
          forwardTo: formData.forwardTo.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create alias')
      }

      toast.success('Alias created successfully!')
      setIsCreateDialogOpen(false)
      setFormData({ localPart: '', forwardTo: '' })
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

    if (!formData.forwardTo.trim()) {
      toast.error('Forward to email is required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/aliases/${editingAlias.id}`, {
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
      setEditingAlias(null)
      setFormData({ localPart: '', forwardTo: '' })
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
    if (!confirm(`Are you sure you want to delete ${alias.localPart}@${domain.fullDomain}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/aliases/${alias.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete alias')
      }

      toast.success('Alias deleted successfully!')
      fetchAliases()
    } catch (error) {
      console.error('Error deleting alias:', error)
      toast.error(error.message)
    }
  }

  const openEditDialog = (alias) => {
    setEditingAlias(alias)
    setFormData({
      localPart: alias.localPart,
      forwardTo: alias.forwardTo,
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading aliases...</p>
        </div>
      </div>
    )
  }

  if (!domain) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Domain not found</h2>
          <Button onClick={() => router.push('/aliases')} className="mt-4">
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
          onClick={() => router.push('/aliases')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Domains
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{domain.fullDomain}</h1>
            <p className="text-gray-600 mt-2">Manage email aliases for this domain</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Alias
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                      onChange={(e) =>
                        setFormData({ ...formData, localPart: e.target.value })
                      }
                      disabled={isSubmitting}
                      autoComplete="off"
                      className="flex-1"
                    />
                    <span className="text-gray-500 font-mono text-sm">
                      @{domain.fullDomain}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Use lowercase letters, numbers, and hyphens only (no dots)
                  </p>
                </div>
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
                    disabled={isSubmitting} />

                  {/* Domain Status Info */}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge
                        variant={domain.verificationStatus === 'verified' ? 'default' : 'secondary'}
                        className={
                          domain.verificationStatus === 'verified'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        }
                      >
                        {domain.verificationStatus === 'verified' ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Last checked: {formatDate(domain.lastCheckedAt)}
                    </div>
                    {domain.pendingEmailCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-yellow-700">
                        <AlertCircle className="w-4 h-4" />
                        <span>{domain.pendingEmailCount} pending emails</span>
                      </div>
                    )}
                  </div>

                  {/* Warning Message */}
                  {domain.verificationStatus === 'pending' && domain.pendingEmailCount > 0 && (
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
                  {domain.verificationStatus === 'pending' && domain.pendingEmailCount > 0 && (
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

                  <p className="text-sm text-gray-500">
                    Emails will be forwarded to this address
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setFormData({ localPart: '', forwardTo: '' })
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Alias'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {aliases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No aliases yet</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Create your first email alias to start forwarding emails
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Alias
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {aliases.map((alias) => (
            <Card
              key={alias.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => router.push(`/aliases/${domainId}/${alias.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg font-mono">
                        {alias.localPart}@{domain.fullDomain}
                      </CardTitle>
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
                    <CardDescription>
                      Forwards to: <span className="font-medium">{alias.forwardTo}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleStatus(alias)}
                      title={alias.isActive ? 'Disable' : 'Enable'}
                    >
                      {alias.isActive ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(alias)}
                      title="Edit forwarding email"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteAlias(alias)}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      title="Delete alias"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{alias.emailCount} emails received</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alias</DialogTitle>
            <DialogDescription>
              Update forwarding email for {editingAlias?.localPart}@{domain.fullDomain}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAlias} className="space-y-4 mt-4">
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
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingAlias(null)
                  setFormData({ localPart: '', forwardTo: '' })
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
    </div>
  )
}

export default DomainAliasesPage
