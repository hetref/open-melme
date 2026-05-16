"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Mail,
  Search,
  Shield,
  HelpCircle,
  X
} from "lucide-react"

// Mock data
const mailboxes = [
  {
    id: "1",
    name: "InvoiceGen",
    email: "shindearyan179@gmail.com",
    aliases: ["invoicegen@aryanshinde.in"],
    tags: ["saas", "invoice-generator"],
    aliasCount: 1,
    activeSessions: 0,
    status: "active",
    createdAt: "Mar 31, 2026, 06:21 PM"
  },
  {
    id: "2",
    name: "Reels Downloader",
    email: null,
    aliases: ["reels.downloader@aryanshinde.in"],
    tags: [],
    aliasCount: 1,
    activeSessions: 0,
    status: "active",
    createdAt: "Mar 31, 2026, 06:21 PM"
  },
  {
    id: "3",
    name: "WaChat",
    email: null,
    aliases: ["wachat@aryanshinde.in"],
    tags: [],
    aliasCount: 1,
    activeSessions: 0,
    status: "active",
    createdAt: "Mar 31, 2026, 06:20 PM"
  },
  {
    id: "4",
    name: "Official Box",
    email: "official@aryanshinde.in",
    aliases: ["support@aryanshinde.in"],
    tags: ["official", "support"],
    aliasCount: 1,
    activeSessions: 2,
    status: "active",
    createdAt: "Mar 30, 2026, 10:15 AM"
  }
]

// Help Dialog Component
function HelpDialog({
  isOpen,
  onClose,
  title,
  children
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export default function MailboxesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSecurityHelp, setShowSecurityHelp] = useState(false)

  const filteredMailboxes = mailboxes.filter(mailbox =>
    mailbox.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mailbox.aliases.some(alias => alias.toLowerCase().includes(searchQuery.toLowerCase())) ||
    mailbox.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[var(--font-display)] text-2xl lg:text-3xl font-bold text-foreground">
          Mailboxes
        </h1>
        <p className="text-muted mt-1">
          Secure mailboxes for receiving and storing emails
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by mailbox name, alias, or tag"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Security Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground text-sm">Mailbox Security</h3>
            <ul className="mt-1.5 space-y-1 text-sm text-muted">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary" />
                Mailbox access requires a separate password
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary" />
                Mailbox sessions expire after 1 hour
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary" />
                Exiting mailbox logs you out immediately
              </li>
            </ul>
          </div>
          <button
            onClick={() => setShowSecurityHelp(true)}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            title="Learn more"
          >
            <HelpCircle size={16} className="text-primary" />
          </button>
        </div>
      </motion.div>

      {/* Mailboxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMailboxes.map((mailbox, index) => (
          <motion.div
            key={mailbox.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-surface border border-border rounded-2xl p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail size={24} className="text-primary" />
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${mailbox.status === "active"
                  ? "bg-[#22c55e]/10 text-[#22c55e]"
                  : "bg-muted/20 text-muted"
                }`}>
                {mailbox.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Mailbox Name */}
            <h3 className="font-semibold text-foreground text-lg mb-1">
              {mailbox.name}
            </h3>
            <p className="text-sm text-muted mb-4">
              {mailbox.email || "No personal email set"}
            </p>

            {/* Aliases */}
            <div className="mb-3">
              <p className="text-xs text-muted mb-1.5">Aliases</p>
              <p className="text-sm font-mono text-foreground-dim truncate">
                {mailbox.aliases[0]}
              </p>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <p className="text-xs text-muted mb-1.5">Tags</p>
              {mailbox.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {mailbox.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-surface-raised text-xs text-foreground-dim"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted italic">No tags yet</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm mb-4 py-3 border-t border-b border-border">
              <div>
                <span className="text-muted">Aliases:</span>
                <span className="ml-2 text-foreground font-medium">{mailbox.aliasCount}</span>
              </div>
              <div>
                <span className="text-muted">Active Sessions:</span>
                <span className="ml-2 text-foreground font-medium">{mailbox.activeSessions}</span>
              </div>
            </div>

            {/* Created Date */}
            <p className="text-xs text-muted mb-4">
              Created {mailbox.createdAt}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                href={`/mailboxes/${mailbox.id}`}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-center border border-border hover:bg-surface-raised transition-colors"
              >
                Manage
              </Link>
              <button className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground transition-colors">
                Access
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMailboxes.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-muted" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No mailboxes found</h3>
          <p className="text-sm text-muted">
            {searchQuery ? "Try a different search term" : "Create your first mailbox to get started"}
          </p>
        </div>
      )}

      {/* Security Help Dialog */}
      <HelpDialog
        isOpen={showSecurityHelp}
        onClose={() => setShowSecurityHelp(false)}
        title="Mailbox Security"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground text-sm mb-1">Separate Password</h4>
            <p className="text-sm text-muted">
              Each mailbox has its own password, separate from your account password. This adds an extra layer of security.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground text-sm mb-1">Session Expiry</h4>
            <p className="text-sm text-muted">
              Mailbox sessions automatically expire after 1 hour of inactivity to protect your emails.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground text-sm mb-1">Immediate Logout</h4>
            <p className="text-sm text-muted">
              When you exit a mailbox, you&apos;re logged out immediately. You&apos;ll need to enter the password again to access it.
            </p>
          </div>
        </div>
      </HelpDialog>
    </div>
  )
}
