"use client"

import { useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { X, Check, Inbox, Mail, ShieldAlert, MessageSquare, Settings } from "lucide-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const pains = [
  { icon: Inbox, text: "All mail lands in one chaotic inbox" },
  { icon: Mail, text: "No clean departmental address structure" },
  { icon: ShieldAlert, text: "Spam hitting your important addresses" },
  { icon: MessageSquare, text: "Missed replies from poor thread visibility" },
  { icon: Settings, text: "Complex DNS setup blocking non-technical teams" },
]

const solutions = [
  { icon: Inbox, text: "Organized aliases with dedicated routing" },
  { icon: Mail, text: "Clean department addresses in seconds" },
  { icon: ShieldAlert, text: "Isolated aliases protect your main inbox" },
  { icon: MessageSquare, text: "Thread-aware inbox with full context" },
  { icon: Settings, text: "One-click DNS verification wizard" },
]

export function PainSolution() {
  const sectionRef = useRef(null)
  const dividerRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    gsap.registerPlugin(ScrollTrigger)
    
    const ctx = gsap.context(() => {
      if (dividerRef.current) {
        gsap.fromTo(
          dividerRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 60%",
            },
          }
        )
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Label */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-[11px] uppercase tracking-[0.15em] text-accent-light/60 mb-4 font-medium"
        >
          Why MelMe
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold text-center text-foreground mb-16"
        >
          From Chaos to Clarity
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-0 relative">
          {/* Center Divider */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2">
            <div
              ref={dividerRef}
              className="w-px h-full bg-gradient-to-b from-transparent via-primary/50 to-transparent origin-top"
            />
          </div>

          {/* Pain Column */}
          <div className="lg:pr-16">
            <h3 className="text-foreground font-semibold text-lg mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <X size={16} className="text-red-400" />
              </span>
              The Old Way
            </h3>
            <div className="space-y-4">
              {pains.map((pain, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg border-l-2 border-red-500/40 bg-surface/50"
                >
                  <pain.icon size={20} className="text-red-400/70 flex-shrink-0 mt-0.5" />
                  <p className="text-foreground-dim text-[15px] leading-relaxed">{pain.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Solution Column */}
          <div className="lg:pl-16">
            <h3 className="text-foreground font-semibold text-lg mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Check size={16} className="text-accent-light" />
              </span>
              The MelMe Way
            </h3>
            <div className="space-y-4">
              {solutions.map((solution, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg border-l-2 border-primary bg-surface/50"
                >
                  <solution.icon size={20} className="text-accent-light flex-shrink-0 mt-0.5" />
                  <p className="text-foreground text-[15px] leading-relaxed">{solution.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
