"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"
import { TextAnimate } from "@/components/ui/text-animate"

const steps = [
  {
    number: "01",
    title: "Connect Your Domain",
    description: "Add your domain to MelMe. We guide you through every step with clear instructions.",
  },
  {
    number: "02",
    title: "Verify DNS Records",
    description: "Set up DKIM and MX records with our one-click copy tool. Verification is automatic.",
  },
  {
    number: "03",
    title: "Create Aliases",
    description: "Generate unlimited email aliases instantly. No waiting, no approval process needed.",
  },
  {
    number: "04",
    title: "Choose Routing",
    description: "Forward to your inbox or use our built-in mailbox. Switch anytime per alias.",
  },
  {
    number: "05",
    title: "Send & Manage",
    description: "Reply as your alias with full thread context. Manage everything from one dashboard.",
  },
]

export function HowItWorks() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [trackWidth, setTrackWidth] = useState("100%")

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    const updateTrackWidth = () => {
      setTrackWidth(`${steps.length * 456 + window.innerWidth / 2}px`)
    }
    checkMobile()
    updateTrackWidth()
    window.addEventListener("resize", checkMobile)
    window.addEventListener("resize", updateTrackWidth)
    return () => {
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("resize", updateTrackWidth)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || isMobile) return
    
    gsap.registerPlugin(ScrollTrigger)

    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const ctx = gsap.context(() => {
      // Calculate scroll width to center the last card
      const cardWidth = 400
      const gap = 56 // 14 * 4
      const viewportWidth = window.innerWidth
      const totalCardsWidth = (cardWidth * steps.length) + (gap * (steps.length - 1))
      // End position: last card centered = totalWidth - viewportWidth/2 - cardWidth/2
      const scrollWidth = totalCardsWidth - viewportWidth / 2 - cardWidth / 2 + 100

      gsap.to(track, {
        x: -scrollWidth,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${scrollWidth}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            const progress = self.progress
            const step = Math.min(Math.floor(progress * steps.length), steps.length - 1)
            setCurrentStep(step)
          },
        },
      })
    })

    return () => ctx.revert()
  }, [isMobile])

  // Mobile version - vertical layout
  if (isMobile) {
    return (
      <section id="how-it-works" className="py-24 relative">
        <div className="max-w-2xl mx-auto px-6">
          {/* Section Header */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-[11px] uppercase tracking-[0.15em] text-accent-light/60 mb-4 font-medium"
          >
            How It Works
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <TextAnimate 
              as="h2"
              animation="blurInUp" 
              by="word"
              className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-center text-foreground"
            >
              Up and Running in Minutes
            </TextAnimate>
          </motion.div>

          {/* Mobile Steps */}
          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-border rounded-xl p-6"
              >
                <span className="text-5xl font-bold text-accent-light/20 font-[var(--font-display)]">
                  {step.number}
                </span>
                <h3 className="text-foreground font-semibold text-xl mt-3 mb-2">{step.title}</h3>
                <p className="text-foreground-dim text-[15px] leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Desktop version - horizontal scroll with progressive blur
  return (
    <section 
      ref={sectionRef} 
      id="how-it-works" 
      className="relative h-screen overflow-hidden"
    >
      {/* Fixed Header */}
      <div className="absolute top-8 left-0 right-0 z-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-accent-light/60 mb-2 font-medium">
              How It Works
            </p>
            <div className="flex items-end gap-8">
              <TextAnimate 
                as="h2"
                animation="blurInUp" 
                by="word"
                once
                className="font-[var(--font-display)] text-3xl lg:text-[44px] font-bold text-foreground"
              >
                Up and Running in Minutes
              </TextAnimate>
              <div className="text-accent-light font-mono text-lg mb-2">
                {String(currentStep + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Track */}
      <div
        ref={trackRef}
        className="flex items-center h-full pt-32 pb-12 pl-12"
        style={{ 
          width: trackWidth,
          gap: "56px"
        }}
      >
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            className={`min-w-[400px] w-[400px] h-[320px] flex flex-col justify-center p-8 rounded-2xl border transition-all duration-500 shrink-0 ${
              currentStep === i
                ? "bg-surface-raised border-primary/35"
                : "bg-surface border-border"
            }`}
          >
            <span className="text-[72px] font-bold text-accent-light/30 font-[var(--font-display)] leading-none">
              {step.number}
            </span>
            <h3 className="text-foreground font-semibold text-[22px] mt-4 mb-3">{step.title}</h3>
            <p className="text-foreground-dim text-base leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Progressive Blur on the right side */}
      <ProgressiveBlur 
        direction="right" 
        className="w-[25%]"
        blurLevels={[0.5, 1, 2, 4, 8, 16, 24]}
      />
    </section>
  )
}
