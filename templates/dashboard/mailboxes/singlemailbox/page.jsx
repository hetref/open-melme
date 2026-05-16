"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Mail,
  Activity,
  Link2,
  HardDrive,
  Power,
  Key,
  Trash2,
  HelpCircle,
  X,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Lock,
  AlertTriangle
} from "lucide-react"

// Mock data
const mailboxData = {
  id: "1",
  name: "InvoiceGen",
  senderName: "InvoiceGen",
  email: "shindearyan179@gmail.com",
  aliases: ["invoicegen@aryanshinde.in"],
  tags: ["saas", "invoice-generator"],
  description: "",
  status: "active",
  createdAt: "Mar 31, 2026, 06:21 PM",
  stats: {
    totalEmails: 0,
    received: 0,
    sent: 0,
    activeSessions: 0,
    activeAliases: 1,
    storageUsed: "0 B"
  },
  sessions: []
}

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

// Modal Component
function Modal({
  isOpen,
  onClose,
  title,
  description,
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
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// Read-only field component
function ReadOnlyField({ label, value, mono = false }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted">{label}</p>
      <div className="px-4 py-2.5 rounded-xl bg-surface-raised border border-border">
        <p className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  )
}

// Input field component
function InputField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required = false
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

export default function MailboxDetailPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState < "overview" | "settings" | "security" | "sessions" > ("overview")
  const [mailbox] = useState(mailboxData)

  // Settings state
  const [mailboxName, setMailboxName] = useState(mailbox.name)
  const [senderName, setSenderName] = useState(mailbox.senderName)
  const [personalEmail, setPersonalEmail] = useState(mailbox.email)
  const [tags, setTags] = useState(mailbox.tags.join(", "))
  const [description, setDescription] = useState(mailbox.description)

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSenderHelp, setShowSenderHelp] = useState(false)
  const [showSessionHelp, setShowSessionHelp] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "settings", label: "Settings" },
    { id: "security", label: "Security" },
    { id: "sessions", label: `Sessions (${mailbox.stats.activeSessions})` }
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        href="/mailboxes"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Mailboxes
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[var(--font-display)] text-2xl lg:text-3xl font-bold text-foreground">
              {mailbox.name}
            </h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${mailbox.status === "active"
                ? "bg-[#22c55e]/10 text-[#22c55e]"
                : "bg-muted/20 text-muted"
              }`}>
              {mailbox.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-muted mt-1">Created {mailbox.createdAt}</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-surface-raised transition-colors">
            <Power size={16} />
            Deactivate
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground transition-colors">
            <Mail size={16} />
            Access Mailbox
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-5"
        >
          <p className="text-sm text-muted mb-3">Total Emails</p>
          <div className="flex items-center gap-2">
            <Mail size={20} className="text-primary" />
            <span className="text-2xl font-bold text-foreground">{mailbox.stats.totalEmails}</span>
          </div>
          <p className="text-xs text-muted mt-2">{mailbox.stats.received} received • {mailbox.stats.sent} sent</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-surface border border-border rounded-2xl p-5"
        >
          <p className="text-sm text-muted mb-3">Active Sessions</p>
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-amber-500" />
            <span className="text-2xl font-bold text-foreground">{mailbox.stats.activeSessions}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-2xl p-5"
        >
          <p className="text-sm text-muted mb-3">Active Aliases</p>
          <div className="flex items-center gap-2">
            <Link2 size={20} className="text-violet-500" />
            <span className="text-2xl font-bold text-foreground">{mailbox.stats.activeAliases}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border border-border rounded-2xl p-5"
        >
          <p className="text-sm text-muted mb-3">Storage Used</p>
          <div className="flex items-center gap-2">
            <HardDrive size={20} className="text-emerald-500" />
            <span className="text-2xl font-bold text-foreground">{mailbox.stats.storageUsed}</span>
          </div>
          <p className="text-xs text-muted mt-2">0 bytes</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-raised rounded-xl p-1 mb-6 grid grid-cols-4 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Mailbox Information */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="font-semibold text-foreground">Mailbox Information</h2>
                <p className="text-sm text-muted mt-0.5">Basic details about this mailbox</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Mailbox Name" value={mailbox.name} />
                <ReadOnlyField label="Sender Name" value={mailbox.senderName} />
                <ReadOnlyField label="Personal Email" value={mailbox.email} mono />
                <div className="space-y-1.5">
                  <p className="text-xs text-muted">Tags</p>
                  <div className="px-4 py-2.5 rounded-xl bg-surface-raised border border-border flex flex-wrap gap-1.5">
                    {mailbox.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-background text-xs text-foreground-dim"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ReadOnlyField label="Assigned Aliases" value={mailbox.aliases[0]} mono />
                <div className="space-y-1.5">
                  <p className="text-xs text-muted">Status</p>
                  <div className="px-4 py-2.5 rounded-xl bg-surface-raised border border-border">
                    <span className="px-2 py-0.5 rounded-md bg-[#22c55e]/10 text-xs font-medium text-[#22c55e]">
                      Active
                    </span>
                  </div>
                </div>
                <ReadOnlyField label="Created" value={mailbox.createdAt} />
              </div>
            </div>

            {/* Aliases Using This Mailbox */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="mb-4">
                <h2 className="font-semibold text-foreground">Aliases Using This Mailbox</h2>
                <p className="text-sm text-muted mt-0.5">Email aliases that forward to this mailbox</p>
              </div>

              <div className="space-y-3">
                {mailbox.aliases.map(alias => (
                  <div
                    key={alias}
                    className="flex items-center justify-between p-4 rounded-xl bg-surface-raised border border-border"
                  >
                    <div>
                      <p className="font-mono text-sm text-foreground">{alias}</p>
                      <p className="text-xs text-muted mt-0.5">Mode: Mailbox</p>
                    </div>
                    <Link
                      href={`/aliases/1/${alias}`}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border hover:bg-background transition-colors"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-foreground">Mailbox Settings</h2>
                  <p className="text-sm text-muted mt-0.5">Update mailbox display information and sender identity</p>
                </div>
                <button
                  onClick={() => setShowSenderHelp(true)}
                  className="p-2 rounded-lg hover:bg-surface-raised transition-colors"
                  title="How Sender Identity Works"
                >
                  <HelpCircle size={18} className="text-muted" />
                </button>
              </div>

              {/* Read-only info */}
              <div className="bg-surface-raised rounded-xl p-4 mb-6 space-y-2">
                <div>
                  <p className="text-xs text-muted">Assigned Aliases</p>
                  <p className="font-mono text-sm text-foreground">{mailbox.aliases[0]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Tags</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {mailbox.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-background text-xs text-foreground-dim"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <InputField
                  label="Mailbox Name"
                  value={mailboxName}
                  onChange={setMailboxName}
                  hint="Unique name for this mailbox (max 100 characters)"
                  required
                />
                <InputField
                  label="Sender Name"
                  value={senderName}
                  onChange={setSenderName}
                  hint="Used as sender name in outbound emails (max 100 characters)"
                  required
                />
                <InputField
                  label="Personal Email"
                  value={personalEmail}
                  onChange={setPersonalEmail}
                  hint="Used to map mailbox access to your email identity"
                  required
                />
                <InputField
                  label="Tags"
                  value={tags}
                  onChange={setTags}
                  hint="Comma-separated tags. These tags can only be changed by the mailbox creator."
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes or description for this mailbox..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors resize-none"
                  />
                  <p className="text-xs text-muted">For your reference only (max 500 characters)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground transition-colors">
                  Save Changes
                </button>
                <button className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-surface-raised transition-colors">
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Password & Security */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="font-semibold text-foreground">Password & Security</h2>
                <p className="text-sm text-muted mt-0.5">Manage mailbox authentication and security settings</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Lock size={18} className="text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground text-sm">Mailbox Password</h3>
                    <p className="text-sm text-muted mt-0.5">
                      This password is separate from your account password and is required to access this mailbox.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-border hover:bg-surface-raised transition-colors"
              >
                <Key size={16} />
                Change Password
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-surface border border-destructive/30 rounded-2xl p-6">
              <div className="mb-4">
                <h2 className="font-semibold text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted mt-0.5">Irreversible and destructive actions</p>
              </div>

              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-destructive mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground text-sm">Delete Mailbox</h3>
                    <p className="text-sm text-destructive mt-0.5">
                      This will permanently delete the mailbox and all associated emails. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-destructive hover:bg-destructive/90 text-white transition-colors"
              >
                <Trash2 size={16} />
                Delete Mailbox
              </button>
            </div>
          </motion.div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-foreground">Active Sessions</h2>
                  <p className="text-sm text-muted mt-0.5">Currently authenticated sessions for this mailbox</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSessionHelp(true)}
                    className="p-2 rounded-lg hover:bg-surface-raised transition-colors"
                    title="Session Information"
                  >
                    <HelpCircle size={18} className="text-muted" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-raised transition-colors" title="Refresh">
                    <RefreshCw size={18} className="text-muted" />
                  </button>
                </div>
              </div>

              {/* Empty State */}
              {mailbox.sessions.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} className="text-muted" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">No active sessions</h3>
                  <p className="text-sm text-muted">
                    Sessions appear here when someone logs into this mailbox
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sender Identity Help Dialog */}
      <HelpDialog
        isOpen={showSenderHelp}
        onClose={() => setShowSenderHelp(false)}
        title="How Sender Identity Works"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-[#22c55e] mt-0.5" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Sender Name</span> is shown in recipient&apos;s inbox as the sender name
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-[#22c55e] mt-0.5" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Mailbox Name</span> is used for identification in your UI
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-[#22c55e] mt-0.5" />
            <p className="text-sm text-foreground">
              Email address remains the alias address (unchanged)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-[#22c55e] mt-0.5" />
            <p className="text-sm text-foreground">
              Changes apply immediately to new emails
            </p>
          </div>
        </div>
      </HelpDialog>

      {/* Session Information Help Dialog */}
      <HelpDialog
        isOpen={showSessionHelp}
        onClose={() => setShowSessionHelp(false)}
        title="Session Information"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-[#22c55e] mt-0.5" />
            <p className="text-sm text-foreground">
              Sessions expire after 1 hour of inactivity
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-[#22c55e] mt-0.5" />
            <p className="text-sm text-foreground">
              You can revoke sessions at any time
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-[#22c55e] mt-0.5" />
            <p className="text-sm text-foreground">
              Changing the mailbox password invalidates all active sessions
            </p>
          </div>
        </div>
      </HelpDialog>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Mailbox Password"
        description="Update the password for this mailbox. All active sessions will be invalidated."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Current Password <span className="text-destructive">*</span>
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              New Password <span className="text-destructive">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
            />
            <p className="text-xs text-muted">At least 8 characters</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Confirm New Password <span className="text-destructive">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Changing the password will log out all active sessions. You&apos;ll need to login again with the new password.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-surface-raised transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground transition-colors">
              Change Password
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Mailbox"
        description="This action cannot be undone."
      >
        <div className="space-y-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
            <p className="text-sm text-foreground">
              Are you sure you want to delete <span className="font-semibold">{mailbox.name}</span>?
              This will permanently delete the mailbox and all associated emails.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-surface-raised transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2.5 rounded-xl text-sm font-medium bg-destructive hover:bg-destructive/90 text-white transition-colors">
              Delete Mailbox
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
