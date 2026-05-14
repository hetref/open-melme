"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { TextAnimate } from "@/components/ui/text-animate"

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "1 domain",
      "5 email aliases",
      "Forward mode only",
      "Basic DNS verification",
      "Email support",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Growth",
    description: "For growing businesses",
    monthlyPrice: 12,
    yearlyPrice: 10,
    features: [
      "3 domains",
      "Unlimited aliases",
      "Forward + Mailbox modes",
      "Reply from alias",
      "Thread-aware inbox",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Pro",
    description: "For teams and agencies",
    monthlyPrice: 29,
    yearlyPrice: 24,
    features: [
      "Unlimited domains",
      "Unlimited aliases",
      "All Growth features",
      "Advanced security (2FA, Passkeys)",
      "S3 attachment storage",
      "API access",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
    gradient: true,
  },
]

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-[11px] uppercase tracking-[0.15em] text-accent-light/60 mb-4 font-medium"
        >
          Pricing
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold text-center text-foreground mb-4"
        >
          <TextAnimate animation="blurInUp" by="word" once>
            Simple, Transparent Pricing
          </TextAnimate>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-center text-foreground-dim text-lg max-w-2xl mx-auto mb-10"
        >
          Start free, upgrade when you need more. No hidden fees, cancel anytime.
        </motion.p>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-medium transition-colors ${!isYearly ? "text-foreground" : "text-muted"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-7 rounded-full bg-surface border border-border p-1"
          >
            <motion.div
              layout
              layoutId="toggle"
              className="w-5 h-5 rounded-full bg-primary"
              animate={{ x: isYearly ? 28 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isYearly ? "text-foreground" : "text-muted"}`}>
            Yearly
          </span>
          <AnimatePresence>
            {isYearly && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium"
              >
                Save 20%
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 lg:p-8 ${
                plan.highlighted
                  ? "bg-surface border border-primary/60 shadow-[0_0_60px_var(--accent-glow)] lg:scale-105 z-10"
                  : plan.gradient
                  ? "border border-transparent"
                  : "bg-surface border border-border"
              }`}
              style={
                plan.gradient
                  ? {
                      background: "linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, var(--primary), var(--accent-light)) border-box",
                    }
                  : undefined
              }
            >
              {/* Badge */}
              {plan.badge && (
                <span className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                  {plan.badge}
                </span>
              )}

              {/* Plan Name */}
              <h3 className="text-foreground font-semibold text-xl mb-1">{plan.name}</h3>
              <p className="text-muted text-sm mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isYearly ? "yearly" : "monthly"}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-baseline gap-1"
                  >
                    <span className="text-foreground font-bold text-4xl font-[var(--font-display)]">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted text-sm">/month</span>
                  </motion.div>
                </AnimatePresence>
                {isYearly && plan.monthlyPrice > 0 && (
                  <p className="text-muted text-xs mt-1">
                    Billed annually (${(isYearly ? plan.yearlyPrice : plan.monthlyPrice) * 12}/year)
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check size={18} className="text-accent-light flex-shrink-0 mt-0.5" />
                    <span className="text-foreground-dim text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : "border border-border text-foreground hover:border-primary/40"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
