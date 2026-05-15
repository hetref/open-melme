"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Globe,
  AtSign,
  Mail,
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

const navItems = [
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    label: "Domains",
    href: "/domains",
    icon: Globe,
  },
  {
    label: "Aliases",
    href: "/aliases",
    icon: AtSign,
  },
  {
    label: "Mailboxes",
    href: "/mailboxes",
    icon: Mail,
  },
  {
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface border border-border shadow-sm"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-foreground" />
      </button>

      {/* Mobile Overlay */}
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

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 72 : 256,
          x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -256 : 0),
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto",
          "bg-surface border-r border-border",
          "flex flex-col",
          "shadow-[2px_0_8px_rgba(0,0,0,0.04)] dark:shadow-[2px_0_8px_rgba(0,0,0,0.2)]"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "h-16 flex items-center border-b border-border",
          isCollapsed ? "justify-center px-2" : "px-4"
        )}>
          <Link href="/" className={cn(
            "flex items-center gap-2 overflow-hidden",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-[var(--font-display)] text-lg font-semibold text-foreground whitespace-nowrap"
                >
                  Mel<span className="text-primary">Me</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Close Button - Mobile only */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "lg:hidden p-1.5 rounded-md hover:bg-surface-raised transition-colors ml-auto",
              isCollapsed && "ml-0"
            )}
            aria-label="Close menu"
          >
            <ChevronLeft size={18} className="text-muted" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200",
                      "group relative",
                      isCollapsed ? "justify-center px-2" : "px-3",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground-dim hover:bg-surface-raised hover:text-foreground"
                    )}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    <item.icon
                      size={20}
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted group-hover:text-foreground-dim"
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
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className={cn(
          "border-t border-border space-y-1",
          isCollapsed ? "p-2" : "p-3"
        )}>
          {/* Theme Toggle */}
          <div className={cn(
            "flex items-center rounded-lg py-2.5",
            isCollapsed ? "justify-center px-2" : "justify-between px-3"
          )}>
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

          {/* Collapse/Expand Toggle - Desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden lg:flex w-full items-center gap-3 py-2.5 rounded-lg transition-all duration-200",
              "text-foreground-dim hover:bg-surface-raised hover:text-foreground",
              isCollapsed ? "justify-center px-2" : "px-3"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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

          {/* Logout */}
          <button
            className={cn(
              "w-full flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200",
              "text-foreground-dim hover:bg-destructive/10 hover:text-destructive",
              isCollapsed ? "justify-center px-2" : "px-3"
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
      </motion.aside>
    </>
  )
}
