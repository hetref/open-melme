"use client"

import { useState, useEffect } from 'react'
import { useMailbox } from '../_context/MailboxContext'
import { ComposeDialog } from '@/components/ComposeDialog'
import { toast } from 'sonner'

/**
 * Global Compose Dialog Wrapper
 * This component manages the compose dialog state from MailboxContext
 * and handles fetching aliases when the dialog opens
 */
export function GlobalComposeDialog() {
  const { session, isComposeDialogOpen, setIsComposeDialogOpen } = useMailbox()
  const [aliases, setAliases] = useState([])
  const [aliasesLoading, setAliasesLoading] = useState(false)

  useEffect(() => {
    if (isComposeDialogOpen && session) {
      fetchAliases()
    }
  }, [isComposeDialogOpen, session])

  const fetchAliases = async () => {
    setAliasesLoading(true)
    try {
      const response = await fetch('/api/my-mailbox/aliases')
      if (!response.ok) {
        // If API fails, set empty aliases array
        setAliases([])
        return
      }

      const data = await response.json()
      // Return all aliases (active and inactive)
      // ComposeDialog will handle showing appropriate warnings
      setAliases(data.aliases || [])
    } catch (error) {
      console.error('Error fetching aliases:', error)
      // On error, set empty aliases array
      setAliases([])
    } finally {
      setAliasesLoading(false)
    }
  }

  // No need for mailbox primary alias anymore
  // Mailboxes now use only assigned aliases for sending

  const handleEmailSent = () => {
    // Trigger custom event to notify EmailListView to refresh
    const event = new CustomEvent('emailSent')
    window.dispatchEvent(event)
  }

  if (!session) {
    return null
  }

  // Check if session is expired
  if (session.expiresAt) {
    const now = new Date()
    const expires = new Date(session.expiresAt)

    if (expires <= now) {
      // Session expired, don't show compose dialog
      return null
    }
  }

  return (
    <ComposeDialog
      open={isComposeDialogOpen}
      onOpenChange={setIsComposeDialogOpen}
      mailbox={session.mailbox}
      aliases={aliases}
      aliasesLoading={aliasesLoading}
      onEmailSent={handleEmailSent}
    />
  )
}
