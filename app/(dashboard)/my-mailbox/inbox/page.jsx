"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMailbox } from '../_context/MailboxContext'
import { EmailListView } from '../_components/EmailListView'
import { Button } from '@/components/ui/button'
import { Clock, PenSquare } from 'lucide-react'

export default function InboxPage() {
  const mailboxContext = useMailbox()
  const session = mailboxContext?.session
  const loading = mailboxContext?.loading
  const openComposeDialog = mailboxContext?.openComposeDialog
  const router = useRouter()
  const emailListRef = useRef(null)

  useEffect(() => {
    if (!loading && !session) {
      // Not authenticated, redirect to my-mailbox parent for login
      router.push('/my-mailbox')
    }
  }, [session, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const getSessionTimeRemaining = () => {
    if (!session?.expiresAt) return ''

    const now = new Date()
    const expires = new Date(session.expiresAt)
    const diffMinutes = Math.floor((expires - now) / (1000 * 60))

    if (diffMinutes <= 0) return 'Expired'
    if (diffMinutes < 60) return `${diffMinutes} min`

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-mono">
              {session.mailbox.emailAlias}
            </h1>
            <p className="text-gray-600 mt-2">Inbox - Received Emails</p>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              onClick={() => openComposeDialog && openComposeDialog()}
              disabled={!openComposeDialog}
              className="gap-2"
            >
              <PenSquare className="w-4 h-4" />
              Compose
            </Button>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Session expires in {getSessionTimeRemaining()}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[calc(100%-6rem)]">
        <EmailListView emailType="received" />
      </div>
    </div>
  )
}
