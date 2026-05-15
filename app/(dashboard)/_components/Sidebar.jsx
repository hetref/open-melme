"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Globe,
  AtSign,
  Inbox,
  MailOpen,
  Send,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'
import { useMailboxStore } from '@/lib/stores/mailboxStore'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'

const AppSidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { data: accountSession } = authClient.useSession()

  const mailboxSession = useMailboxStore((state) => state.session)
  const isSessionValid = useMailboxStore((state) => state.isSessionValid)
  const hasActiveSession = mailboxSession && isSessionValid()
  const isMailboxRoute = pathname === '/my-mailbox' || pathname.startsWith('/my-mailbox/')

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [mailboxExpanded, setMailboxExpanded] = useState(
    pathname.startsWith('/my-mailbox/') || pathname === '/my-mailbox'
  )

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
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Domains', href: '/domains', icon: Globe },
    { label: 'Aliases', href: '/aliases', icon: AtSign },
    { label: 'Mailboxes', href: '/mailboxes', icon: Inbox },
  ]

  const mailboxSubItems = [
    { label: 'Inbox', href: '/my-mailbox/inbox', icon: Inbox },
    { label: 'Sent', href: '/my-mailbox/sent', icon: Send },
    { label: 'Settings', href: '/my-mailbox/settings', icon: Settings },
  ]

  const showMainMenuItems = Boolean(accountSession) && !isMailboxRoute

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface border border-border shadow-sm"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-foreground" />
      </button>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 72 : 256,
          x: isMobileOpen
            ? 0
            : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -256 : 0),
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto',
          'bg-surface border-r border-border',
          'flex flex-col',
          'shadow-[2px_0_8px_rgba(0,0,0,0.04)] dark:shadow-[2px_0_8px_rgba(0,0,0,0.2)]'
        )}
      >
        <div
          className={cn(
            'h-16 flex items-center border-b border-border',
            isCollapsed ? 'justify-center px-2' : 'px-4'
          )}
        >
          <Link
            href="/"
            className={cn('flex items-center gap-2 overflow-hidden', isCollapsed && 'justify-center')}
          >
            <Image
              src="/accent-logo.png"
              alt="MelMe Logo"
              width={32}
              height={32}
              className="shrink-0"
            />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-[var(--font-display)] text-lg font-semibold text-foreground whitespace-nowrap"
                >
                  Mel<span className="text-primary">Me</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              'lg:hidden p-1.5 rounded-md hover:bg-surface-raised transition-colors ml-auto',
              isCollapsed && 'ml-0'
            )}
            aria-label="Close menu"
          >
            <ChevronLeft size={18} className="text-muted" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              if (!showMainMenuItems) return null
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200',
                      'group relative',
                      isCollapsed ? 'justify-center px-2' : 'px-3',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground-dim hover:bg-surface-raised hover:text-foreground'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}

                    <Icon
                      size={20}
                      className={cn(
                        'flex-shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-muted group-hover:text-foreground-dim'
                      )}
                    />

                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-sm font-medium whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </li>
              )
            })}

            <li>
              <button
                type="button"
                onClick={() => {
                  setMailboxExpanded(!mailboxExpanded)
                  if (!mailboxExpanded) {
                    router.push(hasActiveSession ? '/my-mailbox/inbox' : '/my-mailbox')
                  }
                }}
                className={cn(
                  'flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 w-full',
                  'group relative',
                  isCollapsed ? 'justify-center px-2' : 'px-3',
                  pathname.startsWith('/my-mailbox')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-dim hover:bg-surface-raised hover:text-foreground'
                )}
              >
                <MailOpen
                  size={20}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    pathname.startsWith('/my-mailbox')
                      ? 'text-primary'
                      : 'text-muted group-hover:text-foreground-dim'
                  )}
                />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap flex items-center gap-2"
                    >
                      My Mailbox
                      {hasActiveSession && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!isCollapsed && (
                  <span className="ml-auto">
                    {mailboxExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                )}
              </button>

              {mailboxExpanded && hasActiveSession && !isCollapsed && (
                <div className="mt-2 ml-6 space-y-1">
                  {mailboxSubItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-2 py-2 rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground-dim hover:bg-surface-raised hover:text-foreground'
                        )}
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </li>
          </ul>
        </nav>

        {accountSession && !isMailboxRoute && (
          <div className={cn('border-t border-border space-y-1', isCollapsed ? 'p-2' : 'p-3')}>
            <div
              className={cn(
                'flex items-center rounded-lg py-2.5',
                isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
              )}
            >
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted"
                  >
                    Theme
                  </motion.span>
                )}
              </AnimatePresence>
              <AnimatedThemeToggler />
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                'hidden lg:flex w-full items-center gap-3 py-2.5 rounded-lg transition-all duration-200',
                'text-foreground-dim hover:bg-surface-raised hover:text-foreground',
                isCollapsed ? 'justify-center px-2' : 'px-3'
              )}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft size={20} className="flex-shrink-0" />
              </motion.div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    Collapse
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200',
                'text-foreground-dim hover:bg-destructive/10 hover:text-destructive',
                isCollapsed ? 'justify-center px-2' : 'px-3'
              )}
            >
              <LogOut size={20} className="flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    Log out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        )}
      </motion.aside>
    </>
  )
}

export default AppSidebar
