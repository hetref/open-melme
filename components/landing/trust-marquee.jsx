"use client"

import { motion } from "framer-motion"

const trustItems = [
  "DKIM Verified",
  "Secure Mailbox Sessions",
  "Alias Reply Identity",
  "Thread-aware Inbox",
  "Attachment Pipeline",
  "Passkey Auth",
  "2FA + Backup Codes",
  "S3-backed Storage",
]

export function TrustMarquee() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative border-t border-b border-border py-5 overflow-hidden"
    >
      <div className="animate-marquee flex whitespace-nowrap">
        {[...trustItems, ...trustItems].map((item, i) => (
          <div key={i} className="flex items-center mx-6 group">
            <span className="text-muted w-2 h-2 rotate-45 bg-primary/40 mr-6 flex-shrink-0" />
            <span className="text-foreground-dim text-sm font-medium tracking-wide opacity-35 group-hover:opacity-100 group-hover:text-accent-light transition-all duration-300">
              {item}
            </span>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
