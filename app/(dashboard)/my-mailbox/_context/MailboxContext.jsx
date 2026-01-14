"use client"

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useMailboxStore } from '@/lib/stores/mailboxStore'

const MailboxContext = createContext(null)

export function MailboxProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false)
  const router = useRouter()

  // Use Zustand store
  const session = useMailboxStore((state) => state.session)
  const setSession = useMailboxStore((state) => state.setSession)
  const clearSession = useMailboxStore((state) => state.clearSession)
  const isSessionValid = useMailboxStore((state) => state.isSessionValid)

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/mailbox-auth/session')

      if (response.ok) {
        const data = await response.json()

        // Check if session is expired
        const now = new Date()
        const expires = new Date(data.expiresAt)

        if (expires <= now) {
          // Session is expired
          console.log('Mailbox session expired')
          clearSession()
          setLoading(false)
          return null
        }

        setSession(data)
        return data
      } else {
        clearSession()
        return null
      }
    } catch (error) {
      console.error('Error checking session:', error)
      clearSession()
      return null
    } finally {
      setLoading(false)
    }
  }, [setSession, clearSession])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Monitor session expiry from store
  useEffect(() => {
    const checkExpiry = setInterval(() => {
      if (session && !isSessionValid()) {
        console.log('Session expired, redirecting to login')
        toast.error('Your mailbox session has expired. Please login again.')
        router.push('/my-mailbox')
        setIsLoginDialogOpen(true)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(checkExpiry)
  }, [session, isSessionValid, router])

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
  }, [router, setSession])

  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/mailbox-auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to logout')
      }

      clearSession()
      toast.success('Logged out successfully')

      // Open login modal after logout
      setIsLoginDialogOpen(true)
      router.push('/my-mailbox')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to logout')
    }
  }, [router, clearSession])

  const requireAuth = useCallback(() => {
    if (!session && !loading) {
      setIsLoginDialogOpen(true)
      return false
    }
    return true
  }, [session, loading])

  const openComposeDialog = useCallback(() => {
    if (!session || loading) {
      toast.error('Please login to your mailbox first')
      setIsLoginDialogOpen(true)
      return
    }

    // Check if session is expired
    if (!isSessionValid()) {
      toast.error('Your mailbox session has expired. Please login again.')
      clearSession()
      setIsLoginDialogOpen(true)
      router.push('/my-mailbox')
      return
    }

    setIsComposeDialogOpen(true)
  }, [session, loading, router, isSessionValid, clearSession])

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
