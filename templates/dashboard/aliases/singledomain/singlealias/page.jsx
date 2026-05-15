"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Power, 
  Pencil, 
  Trash2,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Inbox,
  Calendar
} from "lucide-react"

// Mock alias data
const aliasData = {
  id: "1",
  email: "wachat@aryanshinde.in",
  localPart: "wachat",
  domain: "aryanshinde.in",
  domainId: "1",
  mode: "mailbox",
  mailboxName: "WaChat",
  status: "inactive",
  domainStatus: "connected",
  lastChecked: "May 14, 2026, 08:27 PM",
  created: "Mar 31, 2026, 06:23 PM",
  lastUpdated: "May 15, 2026, 04:24 AM",
  stats: {
    totalEmails: 2,
    forwarded: 0,
    failed: 0,
    received: 2,
  },
  emailLogs: [
    {
      id: "1",
      subject: "Update: Your inactive Upstash Redis Database has been archived",
      from: "support@upstash.com",
      to: "wachat@aryanshinde.in",
      status: "received",
      date: "Apr 4, 2026, 07:04 AM",
      size: "24.4 KB",
    },
    {
      id: "2",
      subject: "Action Required: Upstash Redis Database Inactivity Final Notice",
      from: "support@upstash.com",
      to: "wachat@aryanshinde.in",
      status: "received",
      date: "Apr 1, 2026, 05:36 AM",
      size: "27.0 KB",
    },
  ],
}

export default function AliasDetailPage() {
  const params = useParams()

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href={`/aliases/${params.id}`}
        className="inline-flex items-center gap-2 text-foreground-dim hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back to Aliases</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="font-mono text-xl lg:text-2xl font-bold text-foreground">
              {aliasData.email}
            </h1>
            {aliasData.mode === "mailbox" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Inbox size={12} />
                Mailbox
              </span>
            )}
          </div>
          <p className="text-foreground-dim mb-3">
            Alias details and email logs
          </p>

          {/* Domain Status */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-foreground-dim">Domain Status:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              aliasData.domainStatus === "connected"
                ? "bg-[#22c55e]/10 text-[#22c55e]"
                : "bg-amber-500/10 text-amber-500"
            }`}>
              {aliasData.domainStatus === "connected" ? "Connected" : "Pending"}
            </span>
            <span className="text-muted">Last checked: {aliasData.lastChecked}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface-raised transition-colors text-sm font-medium text-foreground-dim hover:text-foreground">
            <Power size={16} />
            Enable
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface-raised transition-colors text-sm font-medium text-foreground-dim hover:text-foreground">
            <Pencil size={16} />
            Edit
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors text-sm font-medium text-foreground-dim">
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Alias Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-6"
        >
          <h2 className="text-base font-semibold text-foreground mb-1">Alias Information</h2>
          <p className="text-sm text-foreground-dim mb-5">Configuration and forwarding settings</p>

          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="text-sm text-foreground-dim block mb-1">Status</label>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                aliasData.status === "active"
                  ? "bg-[#22c55e]/10 text-[#22c55e]"
                  : "bg-muted/20 text-muted"
              }`}>
                {aliasData.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-sm text-foreground-dim block mb-1">Email Address</label>
              <p className="font-mono text-sm text-foreground">{aliasData.email}</p>
            </div>

            {/* Mode */}
            <div>
              <label className="text-sm text-foreground-dim block mb-1">Mode</label>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                Store in Mailbox
              </span>
            </div>

            {/* Mailbox */}
            <div>
              <label className="text-sm text-foreground-dim block mb-1">Mailbox</label>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Mail size={14} className="text-muted" />
                {aliasData.mailboxName}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <label className="text-sm text-foreground-dim block mb-1">Created</label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar size={14} className="text-muted" />
                  {aliasData.created}
                </div>
              </div>
              <div>
                <label className="text-sm text-foreground-dim block mb-1">Last Updated</label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar size={14} className="text-muted" />
                  {aliasData.lastUpdated}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Email Statistics Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-2xl p-6"
        >
          <h2 className="text-base font-semibold text-foreground mb-1">Email Statistics</h2>
          <p className="text-sm text-foreground-dim mb-5">Email processing metrics</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Total Emails */}
            <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3b82f6]">{aliasData.stats.totalEmails}</div>
                <div className="text-sm text-[#3b82f6]/70">Total Emails</div>
              </div>
              <Mail size={24} className="text-[#3b82f6]/50" />
            </div>

            {/* Forwarded */}
            <div className="bg-[#22c55e]/5 border border-[#22c55e]/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#22c55e]">{aliasData.stats.forwarded}</div>
                <div className="text-sm text-[#22c55e]/70">Forwarded</div>
              </div>
              <CheckCircle2 size={24} className="text-[#22c55e]/50" />
            </div>

            {/* Failed */}
            <div className="bg-[#ef4444]/5 border border-[#ef4444]/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#ef4444]">{aliasData.stats.failed}</div>
                <div className="text-sm text-[#ef4444]/70">Failed</div>
              </div>
              <XCircle size={24} className="text-[#ef4444]/50" />
            </div>

            {/* Received */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{aliasData.stats.received}</div>
                <div className="text-sm text-primary/70">Received</div>
              </div>
              <Clock size={24} className="text-primary/50" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Email Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-border rounded-2xl p-6"
      >
        <h2 className="text-base font-semibold text-foreground mb-1">Email Logs</h2>
        <p className="text-sm text-foreground-dim mb-5">
          All emails received by this alias ({aliasData.stats.totalEmails} total)
        </p>

        <div className="space-y-3">
          {aliasData.emailLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="bg-background border border-border rounded-xl p-4 hover:border-primary/20 transition-colors cursor-pointer"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-medium text-foreground truncate max-w-md">
                          {log.subject}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#22c55e]/10 text-[#22c55e]">
                          {log.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-foreground-dim">
                        <span>From: <span className="text-foreground">{log.from}</span></span>
                        <span>To: <span className="text-foreground">{log.to}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pl-11 lg:pl-0">
                  <div className="text-xs text-foreground-dim">{log.date}</div>
                  <div className="text-xs text-muted">{log.size}</div>
                </div>
              </div>
            </motion.div>
          ))}

          {aliasData.emailLogs.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-muted" />
              </div>
              <p className="text-sm text-foreground-dim">No emails received yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
