"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, ChevronDown, Mail, Shield, Zap } from "lucide-react"
import gsap from "gsap"
import { EncryptedText } from "@/components/ui/encrypted-text"
import { TextAnimate } from "@/components/ui/text-animate"
import { SpinningText } from "@/components/ui/spinning-text"

export function Hero() {
  const headlineRef = useRef(null)
  const MotionLink = motion(Link)

  useEffect(() => {
    if (!headlineRef.current) return

    const words = headlineRef.current.querySelectorAll(".word")
    const ctx = gsap.context(() => {
      gsap.from(words, {
        y: 70,
        opacity: 0,
        stagger: 0.065,
        duration: 1,
        ease: "power4.out",
        delay: 0.3,
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="glow-orb-1 absolute top-[10%] left-[10%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)" }}
          data-speed="0.8"
        />
        <div
          className="glow-orb-2 absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(80,40,180,0.08) 0%, transparent 70%)" }}
          data-speed="0.7"
        />
        <div
          className="glow-orb-3 absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(167,139,255,0.05) 0%, transparent 70%)" }}
          data-speed="0.9"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">

        {/* Spinning Text Badge - Top Right Corner (Desktop only) */}
        <div className="absolute top-32 right-32 lg:right-16 hidden lg:block">
          <SpinningText
            radius={6}
            duration={12}
            className="text-[11px] font-medium tracking-wider text-accent-light/70"
          >
            {"UNLIMITED ALIASES • ZERO COMPLEXITY • "}
          </SpinningText>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Announcement Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 mb-8"
            >
              <span className="text-accent-light text-sm font-medium">Now with Passkey Auth</span>
              <ArrowRight size={14} className="text-accent-light" />
            </motion.div>

            {/* Headline */}
            <h1
              ref={headlineRef}
              className="font-[var(--font-display)] text-4xl sm:text-5xl lg:text-6xl xl:text-[72px] font-bold leading-[1.1] text-foreground mb-6"
            >
              <span className="word inline-block">Your</span>{" "}
              <span className="word inline-block gradient-text">Domain.</span>{" "}
              <span className="word inline-block">Unlimited</span>{" "}
              <span className="word inline-block">Business</span>{" "}
              <span className="word inline-block">Emails.</span>{" "}
              <span className="word inline-block">Zero</span>{" "}
              <span className="word inline-block">Complexity.</span>
            </h1>

            {/* Subheadline with Encrypted Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-lg text-foreground-dim max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
            >
              <EncryptedText
                text="Create unlimited email aliases on your domain instantly. No mail server required. Route to any inbox or use our built-in mailbox with full reply identity."
                revealDelayMs={30}
                flipDelayMs={40}
                encryptedClassName="text-muted"
                revealedClassName="text-foreground-dim"
              />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6"
            >
              <MotionLink
                href="/register"
                whileHover={{
                  backgroundColor: "var(--primary-hover)",
                  boxShadow: "0 0 24px var(--accent-glow)"
                }}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-base transition-all inline-flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight size={18} />
              </MotionLink>
              <motion.a
                href="#how-it-works"
                whileHover={{ borderColor: "var(--primary)" }}
                className="border border-border text-foreground px-6 py-3 rounded-lg font-medium text-base transition-all inline-flex items-center justify-center gap-2"
              >
                See How It Works
              </motion.a>
            </motion.div>

            {/* Trust Line with TextAnimate */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <TextAnimate
                animation="fadeIn"
                by="word"
                delay={1.2}
                className="text-[13px] text-muted"
              >
                No credit card required · Setup in under 2 minutes · Free plan available
              </TextAnimate>
            </motion.div>
          </div>

          {/* Right Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative hidden lg:block"
            data-speed="0.82"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 40px var(--accent-glow)",
                  "0 0 70px var(--accent-glow)",
                  "0 0 40px var(--accent-glow)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="bg-surface-raised border border-border rounded-2xl p-6 relative"
            >
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Mail size={20} className="text-accent-light" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">support@yourdomain.com</p>
                    <p className="text-muted text-xs">Active · Forward Mode</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e] pulse-dot" />
                  <span className="text-muted text-xs">Verified</span>
                </div>
              </div>

              {/* Mock Aliases List */}
              <div className="space-y-3">
                {[
                  { alias: "hello@", status: "Mailbox", icon: Mail },
                  { alias: "support@", status: "Forward", icon: Zap },
                  { alias: "sales@", status: "Forward", icon: Shield },
                ].map((item, i) => (
                  <motion.div
                    key={item.alias}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.15 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <item.icon size={16} className="text-accent-light" />
                      </div>
                      <span className="text-foreground text-sm">{item.alias}yourdomain.com</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-accent-light bg-primary/10 px-2 py-1 rounded">
                      {item.status}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Create New Alias Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="w-full mt-4 py-3 border border-dashed border-border rounded-lg text-muted text-sm hover:border-primary/40 hover:text-accent-light transition-all"
              >
                + Create New Alias
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bouncing Chevron */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown size={28} className="text-muted" />
      </motion.div>
    </section>
  )
}
