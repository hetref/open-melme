"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMailbox } from './_context/MailboxContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, LogOut, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function MyMailboxPage() {
  const { session, loading, isLoginDialogOpen, setIsLoginDialogOpen, login, logout } = useMailbox()
  const router = useRouter()
  const [mailboxes, setMailboxes] = useState([])
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginData, setLoginData] = useState({
    mailboxId: '',
    password: '',
  })

  useEffect(() => {
    if (!loading && session) {
      // If already logged in, redirect to inbox
      router.push('/my-mailbox/inbox')
    } else if (!loading && !session) {
      // Not logged in, show login dialog
      setIsLoginDialogOpen(true)
      fetchMailboxes()
    }
  }, [loading, session, router])

  const fetchMailboxes = async () => {
    try {
      const response = await fetch('/api/mailboxes')
      if (!response.ok) {
        throw new Error('Failed to fetch mailboxes')
      }
      const data = await response.json()
      setMailboxes(data.mailboxes.filter((m) => m.isActive))
    } catch (error) {
      console.error('Error fetching mailboxes:', error)
      toast.error('Failed to load mailboxes')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!loginData.mailboxId || !loginData.password) {
      toast.error('Please select a mailbox and enter password')
      return
    }

    setIsLoggingIn(true)

    try {
      await login(loginData.mailboxId, loginData.password)
      setLoginData({ mailboxId: '', password: '' })
    } catch (error) {
      // Error is already toasted in the login function
    } finally {
      setIsLoggingIn(false)
    }
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

  if (session) {
    // Render session info while redirecting
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-mono">
                {session.mailbox.emailAlias}
              </h1>
              <p className="text-gray-600 mt-2">Redirecting to inbox...</p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Session expires in {getSessionTimeRemaining()}
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Exit Mailbox
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center py-16">
        <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mailbox Access Required</h2>
        <p className="text-gray-600 mb-6">Please login to access your mailbox</p>
        <Button onClick={() => setIsLoginDialogOpen(true)}>
          <Lock className="w-4 h-4 mr-2" />
          Login to Mailbox
        </Button>
      </div>

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mailbox Login</DialogTitle>
            <DialogDescription>
              Enter your mailbox password to access emails
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="mailboxId">Select Mailbox *</Label>
              {mailboxes.length === 0 ? (
                <div className="text-sm text-gray-600 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  No active mailboxes available. Please create a mailbox first.
                </div>
              ) : (
                <select
                  id="mailboxId"
                  value={loginData.mailboxId}
                  onChange={(e) => setLoginData({ ...loginData, mailboxId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoggingIn}
                  required
                >
                  <option value="">Select a mailbox</option>
                  {mailboxes.map((mailbox) => (
                    <option key={mailbox.id} value={mailbox.id}>
                      {mailbox.emailAlias}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mailbox Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter mailbox password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                disabled={isLoggingIn}
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-800">
                Mailbox sessions expire after 1 hour. After login, you'll be redirected to your inbox.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLoginDialogOpen(false)}
                disabled={isLoggingIn}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoggingIn || mailboxes.length === 0}>
                {isLoggingIn ? 'Logging in...' : 'Access Mailbox'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
