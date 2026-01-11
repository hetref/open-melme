"use client"

import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { useMailbox } from '../my-mailbox/_context/MailboxContext'
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
  PenSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const AppSidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const mailboxContext = useMailbox()
  const openComposeDialog = mailboxContext?.openComposeDialog || (() => {
    // If not in mailbox context, navigate to mailbox
    router.push('/my-mailbox')
  })

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
  ]

  // Compose is handled separately via dialog
  const composeItem = {
    name: 'Compose',
    icon: PenSquare,
  }

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
                      router.push('/my-mailbox')
                    }
                  }}
                  isActive={pathname.startsWith('/my-mailbox')}
                  tooltip="My Mailbox"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <MailOpen className="w-7.5 h-7.5 text-[28px]" />
                  <span>My Mailbox</span>
                  <div className="ml-auto group-data-[collapsible=icon]:hidden">
                    {mailboxExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </SidebarMenuButton>

                {mailboxExpanded && (
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

                    {/* Compose button - opens dialog */}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        onClick={openComposeDialog}
                        className="cursor-pointer"
                      >
                        <PenSquare className="w-4 h-4" />
                        <span>{composeItem.name}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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

      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
