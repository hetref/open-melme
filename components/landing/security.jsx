"use client"

import { motion } from "framer-motion"
import { Smartphone, Fingerprint, Monitor, Mail, Chrome, Key } from "lucide-react"

const securityFeatures = [
  {
    icon: Smartphone,
    title: "2FA with TOTP",
    description: "Time-based one-time passwords for secure authentication.",
  },
  {
    icon: Fingerprint,
    title: "Passkey Authentication",
    description: "Passwordless login with biometric security.",
  },
  {
    icon: Monitor,
    title: "Session Management",
    description: "Full control over active sessions and devices.",
  },
  {
    icon: Mail,
    title: "Email Verification",
    description: "Verified email addresses for account recovery.",
  },
  {
    icon: Chrome,
    title: "Google OAuth",
    description: "Sign in securely with your Google account.",
  },
  {
    icon: Key,
    title: "Backup Codes",
    description: "Recovery codes for emergency access.",
  },
]

export function Security() {
  return (
    <section id="security" className="py-24 lg:py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-[11px] uppercase tracking-[0.15em] text-accent-light/60 mb-4 font-medium"
        >
          Security
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold text-center text-foreground mb-4"
        >
          Enterprise-Grade Trust
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-center text-foreground-dim text-lg max-w-2xl mx-auto mb-16"
        >
          Built-in from day one. Your emails and data are protected by industry-leading security standards.
        </motion.p>

        {/* Security Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ perspective: 800 }}>
          {securityFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ rotateY: 90, opacity: 0 }}
              whileInView={{ rotateY: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.09 }}
              className="bg-surface border border-border rounded-xl p-6 relative"
            >
              {/* Status Dot */}
              <div className="absolute top-5 right-5">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] pulse-dot" />
              </div>

              {/* Icon */}
              <div className="w-11 h-11 rounded-lg bg-primary/12 flex items-center justify-center mb-4">
                <feature.icon size={22} className="text-accent-light" />
              </div>

              {/* Content */}
              <h3 className="text-foreground font-semibold text-base mb-1">{feature.title}</h3>
              <p className="text-foreground-dim text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
