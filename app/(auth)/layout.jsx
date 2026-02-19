"use client"

import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Loading from '@/components/Loading'

const layout = ({ children }) => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isPending) {
      if (session != null) {
        // Only redirect if we're actually on an auth page
        const currentPath = window.location.pathname
        const authPages = ['/login', '/register', '/forget-password', '/reset-password', '/2fa']
        if (authPages.some(page => currentPath.startsWith(page))) {
          router.push('/domains')
        }
      } else {
        setIsChecking(false)
      }
    }
  }, [session, isPending, router])

  if (isPending || isChecking) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}

export default layout
