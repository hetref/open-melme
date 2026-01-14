import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useMailboxStore = create(
  persist(
    (set, get) => ({
      session: null,
      sessionCheckInterval: null,

      // Set the mailbox session
      setSession: (session) => {
        set({ session })

        // Start session expiry checker if not already running
        if (session && !get().sessionCheckInterval) {
          get().startSessionChecker()
        } else if (!session) {
          get().stopSessionChecker()
        }
      },

      // Clear the session
      clearSession: () => {
        get().stopSessionChecker()
        set({ session: null })
      },

      // Check if session is still valid
      isSessionValid: () => {
        const { session } = get()
        if (!session || !session.expiresAt) return false

        const now = new Date()
        const expires = new Date(session.expiresAt)
        return expires > now
      },

      // Start interval to check session expiry
      startSessionChecker: () => {
        // Clear any existing interval
        get().stopSessionChecker()

        // Check every 30 seconds
        const interval = setInterval(() => {
          if (!get().isSessionValid()) {
            get().clearSession()
          }
        }, 30000)

        set({ sessionCheckInterval: interval })
      },

      // Stop the session checker
      stopSessionChecker: () => {
        const { sessionCheckInterval } = get()
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval)
          set({ sessionCheckInterval: null })
        }
      },

      // Get time remaining in session
      getSessionTimeRemaining: () => {
        const { session } = get()
        if (!session?.expiresAt) return null

        const now = new Date()
        const expires = new Date(session.expiresAt)
        const diffMinutes = Math.floor((expires - now) / (1000 * 60))

        if (diffMinutes <= 0) return { expired: true, text: 'Expired' }
        if (diffMinutes < 60) return { expired: false, text: `${diffMinutes} min` }

        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        return { expired: false, text: `${hours}h ${minutes}m` }
      },
    }),
    {
      name: 'mailbox-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, start the checker if there's a valid session
        if (state && state.session && state.isSessionValid()) {
          state.startSessionChecker()
        } else if (state && state.session) {
          // Session expired during rehydration
          state.clearSession()
        }
      },
    }
  )
)
