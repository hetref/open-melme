"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertCircle, Trash2, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/**
 * AliasDeletionModal
 * 
 * Handles the strict alias deletion flow:
 * - Forward aliases: Simple confirmation
 * - Mailbox aliases: Must choose transfer or delete
 */
export function AliasDeletionModal({
  isOpen,
  onClose,
  alias,
  onSuccess
}) {
  const [loading, setLoading] = useState(true)
  const [deleteInfo, setDeleteInfo] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null) // 'transfer' or 'delete'
  const [selectedTargetAlias, setSelectedTargetAlias] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isOpen && alias) {
      fetchDeleteInfo()
    }
  }, [isOpen, alias])

  const fetchDeleteInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/aliases/${alias.id}/delete`)

      if (!response.ok) {
        throw new Error('Failed to fetch deletion info')
      }

      const data = await response.json()
      setDeleteInfo(data)
    } catch (error) {
      console.error('Error fetching deletion info:', error)
      toast.error('Failed to load deletion information')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!alias) return

    // Forward alias - simple delete
    if (alias.mode === 'forward') {
      setIsDeleting(true)
      try {
        const response = await fetch(`/api/aliases/${alias.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to delete alias')
        }

        toast.success('Forwarding alias deleted successfully')
        onSuccess()
        onClose()
      } catch (error) {
        console.error('Error deleting forward alias:', error)
        toast.error(error.message)
      } finally {
        setIsDeleting(false)
      }
      return
    }

    const hasNoMailboxEmails = alias.mode === 'mailbox'
      && deleteInfo
      && deleteInfo.stats
      && deleteInfo.stats.emailCount === 0

    if (hasNoMailboxEmails) {
      setIsDeleting(true)
      try {
        const response = await fetch(`/api/aliases/${alias.id}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'delete' }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete alias')
        }

        toast.success('Alias deleted successfully')
        onSuccess()
        onClose()
      } catch (error) {
        console.error('Error deleting mailbox alias:', error)
        toast.error(error.message)
      } finally {
        setIsDeleting(false)
      }
      return
    }

    // Mailbox alias - require action selection
    if (!selectedAction) {
      toast.error('Please select an action: transfer or delete')
      return
    }

    if (selectedAction === 'transfer' && !selectedTargetAlias) {
      toast.error('Please select a target alias for transfer')
      return
    }

    if (selectedAction === 'delete' && !confirmDelete) {
      toast.error('Please confirm deletion by checking the box')
      return
    }

    setIsDeleting(true)

    try {
      const body = {
        action: selectedAction,
      }

      if (selectedAction === 'transfer') {
        body.targetAliasId = selectedTargetAlias
      }

      const response = await fetch(`/api/aliases/${alias.id}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete alias')
      }

      if (selectedAction === 'transfer') {
        toast.success(`Transferred ${data.transferred} emails successfully`)
      } else {
        toast.success(`Deleted ${data.emailsDeleted} emails and ${data.attachmentsDeleted} attachments`)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting alias:', error)
      toast.error(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const resetState = () => {
    setSelectedAction(null)
    setSelectedTargetAlias('')
    setConfirmDelete(false)
    setDeleteInfo(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  if (!alias) return null

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trash2 className="w-5 h-5 text-red-600" />
            Delete Alias: {alias.localPart}@{alias.domainName}
          </DialogTitle>
          <DialogDescription>
            {alias.mode === 'forward'
              ? 'This forwarding alias will be permanently deleted.'
              : 'This alias stores emails in a mailbox. You must choose what to do with existing emails.'
            }
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : deleteInfo ? (
          <div className="space-y-6 mt-4">
            {/* Stats Display */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Emails</p>
                  <p className="text-2xl font-bold text-gray-900">{deleteInfo.stats.emailCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Attachments</p>
                  <p className="text-2xl font-bold text-gray-900">{deleteInfo.stats.attachmentCount}</p>
                </div>
                {deleteInfo.stats.totalSize > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Total Size</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatSize(deleteInfo.stats.totalSize)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Forward Alias - Simple Confirmation */}
            {alias.mode === 'forward' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Forward Mode Alias</p>
                    <p>
                      Email logs are for audit/debugging only. No attachments are stored in S3.
                      Deletion is fast and does not affect forwarded emails.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mailbox Alias - Action Selection */}
            {alias.mode === 'mailbox' && deleteInfo.stats.emailCount > 0 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Choose an action (required)</Label>

                  {/* Option A: Transfer */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedAction === 'transfer'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => setSelectedAction('transfer')}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="transfer"
                        checked={selectedAction === 'transfer'}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-gray-900">Transfer Emails (Recommended)</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Move all emails and attachments to another mailbox alias.
                          Conversations and attachments remain intact.
                        </p>

                        {selectedAction === 'transfer' && (
                          <div className="space-y-2 mt-3">
                            <Label htmlFor="targetAlias" className="text-sm">Select target alias</Label>
                            {deleteInfo.transferTargets.length === 0 ? (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                No other active mailbox aliases available in this domain.
                                Create another mailbox alias first, or choose delete option.
                              </div>
                            ) : (
                              <select
                                id="targetAlias"
                                value={selectedTargetAlias}
                                onChange={(e) => setSelectedTargetAlias(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select a target alias...</option>
                                {deleteInfo.transferTargets.map((target) => (
                                  <option key={target.id} value={target.id}>
                                    {target.fullEmail}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Option B: Delete Everything */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedAction === 'delete'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => setSelectedAction('delete')}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="delete"
                        checked={selectedAction === 'delete'}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Trash2 className="w-4 h-4 text-red-600" />
                          <span className="font-semibold text-gray-900">Delete Everything</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Permanently delete all emails, attachments, and S3 objects.
                          This action cannot be undone.
                        </p>

                        {selectedAction === 'delete' && (
                          <div className="mt-3 space-y-3">
                            <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                              <p className="text-sm text-red-800 font-medium">
                                ⚠️ Warning: This action is permanent and cannot be undone.
                              </p>
                            </div>

                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={confirmDelete}
                                onChange={(e) => setConfirmDelete(e.target.checked)}
                                className="mt-1"
                              />
                              <span className="text-sm text-gray-700">
                                I understand this will permanently delete {deleteInfo.stats.emailCount} emails
                                and {deleteInfo.stats.attachmentCount} attachments. This cannot be undone.
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Mailbox Alias with no emails */}
            {alias.mode === 'mailbox' && deleteInfo.stats.emailCount === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  This alias has no emails. It will be deleted immediately.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="min-w-30"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Alias
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
