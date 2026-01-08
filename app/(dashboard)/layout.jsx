"use client"

import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Loading from '@/components/Loading'
import AppSidebar from './_components/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

const layout = ({ children }) => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isPending) {
      if (session == null) {
        toast.error('You must be logged in to access the dashboard.')
        router.push('/login')
      } else {
        setIsChecking(false)
      }
    }
  }, [session, isPending, router])

  if (isPending || isChecking) {
    return <Loading />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-18 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
        </header>
        <div className="flex-1 bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
          <div className="container mx-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default layout