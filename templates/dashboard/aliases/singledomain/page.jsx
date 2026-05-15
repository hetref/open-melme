"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Mail, 
  Power, 
  Pencil, 
  Trash2,
  Inbox,
  Loader2
} from "lucide-react"

// Mock data
const domainData = {
  id: "1",
  domain: "aryanshinde.in",
  verified: true,
}

const aliasesData = [
  {
    id: "1",
    localPart: "wachat",
    email: "wachat@aryanshinde.in",
    mode: "mailbox",
    mailboxName: "WaChat",
    status: "inactive",
    emailsReceived: 2,
  },
  {
    id: "2",
    localPart: "support",
    email: "support@aryanshinde.in",
    mode: "mailbox",
    mailboxName: "Official Box",
    status: "active",
    emailsReceived: 10,
  },
  {
    id: "3",
    localPart: "reels.downloader",
    email: "reels.downloader@aryanshinde.in",
    mode: "mailbox",
    mailboxName: "Reels Downloader",
    status: "active",
    emailsReceived: 20,
  },
  {
    id: "4",
    localPart: "invoicegen",
    email: "invoicegen@aryanshinde.in",
    mode: "mailbox",
    mailboxName: "InvoiceGen",
    status: "active",
    emailsReceived: 0,
  },
]

export default function DomainAliasesPage() {
  const params = useParams()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    localPart: "",
    mode: "forward",
    personalEmail: "",
    forwardToEmail: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setShowCreateModal(false)
    setFormData({ localPart: "", mode: "forward", personalEmail: "", forwardToEmail: "" })
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/aliases"
        className="inline-flex items-center gap-2 text-foreground-dim hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back to Domains</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-mono text-2xl lg:text-3xl font-bold text-foreground mb-2">
            {domainData.domain}
          </h1>
          <p className="text-foreground-dim">
            Manage email aliases for this domain
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Create Alias
        </button>
      </div>

      {/* Aliases List */}
      <div className="space-y-4">
        {aliasesData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Aliases Yet</h3>
            <p className="text-foreground-dim mb-6 max-w-sm mx-auto">
              Create your first email alias to start receiving emails.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={18} />
              Create Alias
            </button>
          </motion.div>
        ) : (
          aliasesData.map((alias, index) => (
            <motion.div
              key={alias.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Alias Info */}
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/aliases/${params.id}/${alias.id}`}
                    className="group"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-mono text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {alias.email}
                      </h3>
                      {alias.mode === "mailbox" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Inbox size={10} />
                          Mailbox
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        alias.status === "active"
                          ? "bg-[#22c55e]/10 text-[#22c55e]"
                          : "bg-muted/20 text-muted"
                      }`}>
                        {alias.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </Link>

                  <p className="text-sm text-foreground-dim mb-3">
                    Stored in mailbox: <span className="text-foreground">{alias.mailboxName}</span>
                  </p>

                  <div className="flex items-center gap-2 text-sm text-foreground-dim">
                    <Mail size={14} />
                    <span>{alias.emailsReceived} emails received</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    className="p-2.5 rounded-lg border border-border hover:bg-surface-raised hover:border-primary/30 transition-colors group"
                    title={alias.status === "active" ? "Disable" : "Enable"}
                  >
                    <Power size={16} className="text-muted group-hover:text-foreground" />
                  </button>
                  <button
                    className="p-2.5 rounded-lg border border-border hover:bg-surface-raised hover:border-primary/30 transition-colors group"
                    title="Edit"
                  >
                    <Pencil size={16} className="text-muted group-hover:text-foreground" />
                  </button>
                  <button
                    className="p-2.5 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 transition-colors group"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-muted group-hover:text-destructive" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Alias Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Create New Alias</h2>
                  <p className="text-sm text-foreground-dim mt-1">
                    Create a new email alias for {domainData.domain}
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg hover:bg-surface-raised transition-colors"
                >
                  <X size={20} className="text-muted" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Local Part */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Local Part
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.localPart}
                      onChange={(e) => setFormData({ ...formData, localPart: e.target.value })}
                      placeholder="support"
                      className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                    <span className="text-foreground-dim text-sm">@{domainData.domain}</span>
                  </div>
                  <p className="text-xs text-muted mt-1.5">
                    Use lowercase letters, numbers, dots, hyphens, or underscores
                  </p>
                </div>

                {/* Alias Mode */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Alias Mode
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: "forward", label: "Forward to email" },
                      { value: "mailbox", label: "Store in mailbox" },
                      { value: "create", label: "Create mailbox" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value={option.value}
                          checked={formData.mode === option.value}
                          onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                          className="w-4 h-4 text-primary border-border focus:ring-primary/20"
                        />
                        <span className="text-sm text-foreground">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Personal Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    placeholder="you@gmail.com"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <p className="text-xs text-muted mt-1.5">
                    Used as your primary contact email for this alias setup.
                  </p>
                </div>

                {/* Forward To Email */}
                {formData.mode === "forward" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Forward To Email
                    </label>
                    <input
                      type="email"
                      value={formData.forwardToEmail}
                      onChange={(e) => setFormData({ ...formData, forwardToEmail: e.target.value })}
                      placeholder="you@gmail.com"
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                    <p className="text-xs text-muted mt-1.5">
                      Emails will be forwarded to this address
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-foreground-dim">Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#22c55e]">
                    Connected
                  </span>
                  <span className="text-muted">Last checked: May 14, 2026, 08:27 PM</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-raised transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isLoading && <Loader2 size={16} className="animate-spin" />}
                    Create Alias
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
