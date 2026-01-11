"use client"

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const MailboxContext = createContext(null)

export function MailboxProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false)
  const router = useRouter()

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/mailbox-auth/session')

      if (response.ok) {
        const data = await response.json()
        setSession(data)
        return data
      } else {
        setSession(null)
        return null
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setSession(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = useCallback(async (mailboxId, password) => {
    try {
      const response = await fetch('/api/mailbox-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mailboxId, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login')
      }

      setSession(data)
      setIsLoginDialogOpen(false)
      toast.success('Login successful!')

      // Navigate to inbox after login
      router.push('/my-mailbox/inbox')

      return data
    } catch (error) {
      console.error('Error logging in:', error)
      toast.error(error.message)
      throw error
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/mailbox-auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to logout')
      }

      setSession(null)
      toast.success('Logged out successfully')
      router.push('/my-mailbox')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to logout')
    }
  }, [router])

  const requireAuth = useCallback(() => {
    if (!session && !loading) {
      setIsLoginDialogOpen(true)
      return false
    }
    return true
  }, [session, loading])

  const openComposeDialog = useCallback(() => {
    if (session && !loading) {
      setIsComposeDialogOpen(true)
    } else {
      toast.error('Please login to your mailbox first')
      setIsLoginDialogOpen(true)
    }
  }, [session, loading])

  const value = {
    session,
    loading,
    isLoginDialogOpen,
    setIsLoginDialogOpen,
    isComposeDialogOpen,
    setIsComposeDialogOpen,
    openComposeDialog,
    login,
    logout,
    checkSession,
    requireAuth,
  }

  return (
    <MailboxContext.Provider value={value}>
      {children}
    </MailboxContext.Provider>
  )
}

export function useMailbox() {
  const context = useContext(MailboxContext)
  return context // Return null if not within provider
}
