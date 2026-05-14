"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Inbox, Send, Edit3 } from "lucide-react"

const tabs = ["Inbox", "Sent", "Compose"]

const emails = [
  {
    initials: "JD",
    from: "John Doe",
    subject: "Partnership Opportunity",
    preview: "Hi, I wanted to discuss a potential partnership between our companies...",
    time: "2m ago",
  },
  {
    initials: "SM",
    from: "Sarah Miller",
    subject: "Re: Q4 Report Review",
    preview: "Thanks for sending over the report. I have a few comments on page 3...",
    time: "15m ago",
  },
  {
    initials: "TK",
    from: "Tom King",
    subject: "Meeting Reschedule",
    preview: "Can we move our 3pm meeting to tomorrow? Something came up...",
    time: "1h ago",
  },
  {
    initials: "AL",
    from: "Amy Lee",
    subject: "Invoice #2847",
    preview: "Please find attached the invoice for last month&apos;s services...",
    time: "3h ago",
  },
  {
    initials: "MR",
    from: "Mike Ross",
    subject: "Welcome to the team!",
    preview: "Excited to have you onboard. Here&apos;s what you need to know...",
    time: "1d ago",
  },
]

const sentEmails = [
  {
    initials: "JD",
    to: "John Doe",
    subject: "Re: Partnership Opportunity",
    preview: "Thanks for reaching out! I would love to discuss this further...",
    time: "5m ago",
  },
  {
    initials: "CL",
    to: "Client List",
    subject: "Monthly Newsletter - April",
    preview: "Hello everyone, here&apos;s your monthly update from our team...",
    time: "2h ago",
  },
  {
    initials: "SM",
    to: "Sarah Miller",
    subject: "Q4 Report Review",
    preview: "Please review the attached Q4 report at your earliest convenience...",
    time: "1d ago",
  },
]

const features = [
  "Full inbox and sent management",
  "Gmail-style threading with message-id",
  "Reply as your alias identity",
]

export function MailboxShowcase() {
  const [activeTab, setActiveTab] = useState("Inbox")

  return (
    <section className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[11px] uppercase tracking-[0.15em] text-accent-light/60 mb-4 font-medium"
            >
              Mailbox Mode
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-[42px] font-bold text-foreground mb-6 leading-tight"
            >
              A Real Inbox. For Your Alias Identity.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-foreground-dim text-lg mb-8 leading-relaxed"
            >
              More than just forwarding. MelMe gives you a full-featured mailbox
              with threaded conversations, sent mail tracking, and alias-based reply identity.
            </motion.p>

            {/* Feature List */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-accent-light" />
                  </div>
                  <span className="text-foreground text-[15px]">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 90 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative w-full max-w-full overflow-hidden"
          >
            <div className="bg-surface-raised border border-border rounded-2xl overflow-hidden w-full">
              {/* Tab Bar */}
              <div className="flex border-b border-border p-2 gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${activeTab === tab
                      ? "bg-primary/15 text-accent-light"
                      : "text-muted hover:text-foreground-dim"
                      }`}
                  >
                    {tab === "Inbox" && <Inbox size={14} className="sm:w-4 sm:h-4" />}
                    {tab === "Sent" && <Send size={14} className="sm:w-4 sm:h-4" />}
                    {tab === "Compose" && <Edit3 size={14} className="sm:w-4 sm:h-4" />}
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-3 sm:p-4 min-h-[380px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    {activeTab === "Inbox" && (
                      <div className="space-y-2">
                        {emails.map((email, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-accent-light text-[10px] sm:text-xs font-medium">{email.initials}</span>
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center justify-between gap-2 mb-0.5 sm:mb-1">
                                <span className="text-foreground text-xs sm:text-sm font-medium truncate">{email.from}</span>
                                <span className="text-muted text-[10px] sm:text-xs flex-shrink-0">{email.time}</span>
                              </div>
                              <p className="text-foreground-dim text-xs sm:text-sm truncate">{email.subject}</p>
                              <p className="text-muted text-[10px] sm:text-xs line-clamp-1">{email.preview}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {activeTab === "Sent" && (
                      <div className="space-y-2">
                        {sentEmails.map((email, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                              <Send size={12} className="text-[#22c55e] sm:w-3.5 sm:h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center justify-between gap-2 mb-0.5 sm:mb-1">
                                <span className="text-foreground text-xs sm:text-sm font-medium truncate">To: {email.to}</span>
                                <span className="text-muted text-[10px] sm:text-xs flex-shrink-0">{email.time}</span>
                              </div>
                              <p className="text-foreground-dim text-xs sm:text-sm truncate">{email.subject}</p>
                              <p className="text-muted text-[10px] sm:text-xs line-clamp-1">{email.preview}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {activeTab === "Compose" && (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-muted text-xs sm:text-sm w-10 sm:w-12">From:</span>
                            <span className="text-accent-light text-xs sm:text-sm truncate">support@yourdomain.com</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-muted text-xs sm:text-sm w-10 sm:w-12">To:</span>
                            <input
                              type="text"
                              placeholder="recipient@email.com"
                              className="flex-1 min-w-0 bg-surface border border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40"
                            />
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-muted text-xs sm:text-sm w-10 sm:w-12">Subject:</span>
                            <input
                              type="text"
                              placeholder="Email subject"
                              className="flex-1 min-w-0 bg-surface border border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40"
                            />
                          </div>
                        </div>
                        <textarea
                          placeholder="Write your message..."
                          rows={5}
                          className="w-full bg-surface border border-border rounded-lg px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 resize-none"
                        />
                        <div className="flex justify-end">
                          <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors">
                            Send Email
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Floating Tooltip */}
              {activeTab === "Compose" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-20 right-8 bg-surface border border-primary/30 rounded-lg px-3 py-2 text-xs text-accent-light"
                >
                  Replying as support@yourdomain.com
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
