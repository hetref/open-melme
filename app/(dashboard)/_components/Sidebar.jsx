"use client"

import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
  SidebarRail,
} from "@/components/ui/sidebar"
import { User, Globe, LogOut, Mail } from 'lucide-react'

const AppSidebar = () => {
  const pathname = usePathname()
  const router = useRouter()

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
  ]

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
                  <SidebarMenuItem key={item.path}
                    className="flex items-center justify-center ">
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
