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

  useEffect(() => {
    if (isComposeDialogOpen && session) {
      fetchAliases()
    }
  }, [isComposeDialogOpen, session])

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

  const handleEmailSent = () => {
    toast.success('Email sent successfully!')
    // Could trigger a refresh event here if needed
  }

  if (!session) {
    return null
  }

  return (
    <ComposeDialog
      open={isComposeDialogOpen}
      onOpenChange={setIsComposeDialogOpen}
      mailbox={session.mailbox}
      aliases={aliases}
      onEmailSent={handleEmailSent}
    />
  )
}
