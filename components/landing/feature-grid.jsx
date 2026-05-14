"use client"

import { motion } from "framer-motion"
import { 
  Zap, 
  Forward, 
  Inbox, 
  Reply, 
  MessageSquare, 
  Paperclip, 
  ShieldCheck, 
  Lock, 
  Globe 
} from "lucide-react"
import { TextAnimate } from "@/components/ui/text-animate"

const features = [
  {
    icon: Zap,
    title: "Instant Alias Creation",
    description: "Create email aliases on your domain in seconds. No waiting, no technical setup required.",
    badge: null,
  },
  {
    icon: Forward,
    title: "Forward Mode",
    description: "Route incoming emails to any external inbox. Perfect for teams using Gmail or Outlook.",
    badge: null,
  },
  {
    icon: Inbox,
    title: "Mailbox Mode",
    description: "Private session-gated inbox inside MelMe. Full control over your communications.",
    badge: "New",
  },
  {
    icon: Reply,
    title: "Reply From Alias",
    description: "Send emails as your alias for brand-consistent outbound communication.",
    badge: null,
  },
  {
    icon: MessageSquare,
    title: "Thread-Aware Inbox",
    description: "Gmail-style conversation grouping with message-id and in-reply-to threading.",
    badge: null,
  },
  {
    icon: Paperclip,
    title: "Secure Attachments",
    description: "S3-backed upload and controlled download. Enterprise-grade file handling.",
    badge: null,
  },
  {
    icon: ShieldCheck,
    title: "DKIM & MX Intelligence",
    description: "Live DNS status visibility with verification intelligence and auto-detection.",
    badge: null,
  },
  {
    icon: Lock,
    title: "Full Security Stack",
    description: "2FA, passkeys, and session controls. Your emails are protected by design.",
    badge: "Pro",
  },
  {
    icon: Globe,
    title: "Multi-Domain Support",
    description: "Scale from free tier to unlimited pro. Manage all your domains in one place.",
    badge: null,
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-[11px] uppercase tracking-[0.15em] text-accent-light/60 mb-4 font-medium"
        >
          Features
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold text-center text-foreground mb-4"
        >
          <TextAnimate animation="blurInUp" by="word" once>
            Everything You Need
          </TextAnimate>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-center text-foreground-dim text-lg max-w-2xl mx-auto mb-16"
        >
          Powerful features designed for modern businesses. Simple to use, impossible to outgrow.
        </motion.p>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ 
                y: -5, 
                borderColor: "rgba(124,58,237,0.4)",
                boxShadow: "0 24px 60px var(--accent-glow)"
              }}
              className="relative bg-surface border border-border rounded-[14px] p-7 transition-all duration-300"
            >
              {/* Badge */}
              {feature.badge && (
                <span className="absolute top-4 right-4 text-[11px] font-medium px-2 py-1 rounded bg-primary text-primary-foreground">
                  {feature.badge}
                </span>
              )}

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/12 flex items-center justify-center mb-5">
                <feature.icon size={24} className="text-accent-light" />
              </div>

              {/* Content */}
              <h3 className="text-foreground font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-foreground-dim text-[15px] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
