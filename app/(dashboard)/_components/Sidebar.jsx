"use client"

import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { useMailboxStore } from '@/lib/stores/mailboxStore'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  User,
  Globe,
  LogOut,
  Mail,
  Inbox,
  MailOpen,
  Send,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const AppSidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { data: accountSession } = authClient.useSession()

  // Get session status from Zustand store
  const mailboxSession = useMailboxStore((state) => state.session)
  const isSessionValid = useMailboxStore((state) => state.isSessionValid)
  const hasActiveSession = mailboxSession && isSessionValid()
  const isMailboxRoute = pathname === '/my-mailbox' || pathname.startsWith('/my-mailbox/')

  // Auto-expand if we're on a my-mailbox sub-page
  const [mailboxExpanded, setMailboxExpanded] = useState(
    pathname.startsWith('/my-mailbox/') || pathname === '/my-mailbox'
  )

  // Update expansion state when pathname changes
  useEffect(() => {
    if (pathname.startsWith('/my-mailbox/') || pathname === '/my-mailbox') {
      setMailboxExpanded(true)
    }
  }, [pathname])

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success('Logged out successfully')
            router.push('/login')
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || 'Failed to logout')
          },
        },
      })
    } catch (error) {
      toast.error('An error occurred during logout')
    }
  }

  const menuItems = [
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
    },
    {
      name: 'Domains',
      path: '/domains',
      icon: Globe,
    },
    {
      name: 'Aliases',
      path: '/aliases',
      icon: Mail,
    },
    {
      name: 'Mailboxes',
      path: '/mailboxes',
      icon: Inbox,
    },
  ]

  const mailboxSubItems = [
    {
      name: 'Inbox',
      path: '/my-mailbox/inbox',
      icon: Inbox,
    },
    {
      name: 'Sent',
      path: '/my-mailbox/sent',
      icon: Send,
    },
    {
      name: 'Settings',
      path: '/my-mailbox/settings',
      icon: Settings,
    },
  ]

  const showMainMenuItems = Boolean(accountSession) && !isMailboxRoute

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <Image
              src="/accent-logo.png"
              alt="MelMe Logo"
              width={60}
              height={60}
              className="shrink-0"
            />
            <span className="font-bold text-xl text-sidebar-foreground">MelMe</span>
          </Link>
          <Link href="/" className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
            <Image
              src="/accent-logo.png"
              alt="MelMe Logo"
              width={80}
              height={80}
              className="shrink-0"
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (!showMainMenuItems) {
                  return null
                }

                const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <Link href={item.path} className="flex items-center gap-2">
                        <Icon className="w-7.5 h-7.5 text-[28px]" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* My Mailbox - Collapsible Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    // Toggle expansion
                    setMailboxExpanded(!mailboxExpanded)
                    // Navigate to my-mailbox if collapsed
                    if (!mailboxExpanded) {
                      router.push(hasActiveSession ? '/my-mailbox/inbox' : '/my-mailbox')
                    }
                  }}
                  isActive={pathname.startsWith('/my-mailbox')}
                  tooltip="My Mailbox"
                  className="flex items-center gap-2 cursor-pointer relative"
                >
                  {/* <div className="relative"> */}
                  <MailOpen className="w-7.5 h-7.5 text-[28px]" />

                  {/* </div> */}
                  <span className="flex items-center gap-2">
                    My Mailbox
                    {hasActiveSession && (
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse group-data-[collapsible=icon]:hidden" />
                    )}
                  </span>
                  <div className="ml-auto group-data-[collapsible=icon]:hidden">
                    {mailboxExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </SidebarMenuButton>

                {mailboxExpanded && hasActiveSession && (
                  <SidebarMenuSub>
                    {mailboxSubItems.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubActive = pathname === subItem.path
                      return (
                        <SidebarMenuSubItem key={subItem.path}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubActive}
                          >
                            <Link href={subItem.path} className="flex items-center gap-2">
                              <SubIcon className="w-4 h-4" />
                              <span>{subItem.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {accountSession && !isMailboxRoute && (
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Logout"
                className="hover:bg-destructive hover:text-white transition-colors"
              >
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
