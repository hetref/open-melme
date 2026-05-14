"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MorphingText } from "@/components/ui/morphing-text"
import { TextAnimate } from "@/components/ui/text-animate"

export function FinalCTA() {
  const headlineRef = useRef(null)
  const [isIdle, setIsIdle] = useState(false)
  const MotionLink = motion(Link)

  useEffect(() => {
    if (typeof window === 'undefined') return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll(".word")
        gsap.from(words, {
          y: 50,
          opacity: 0,
          stagger: 0.08,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headlineRef.current,
            start: "top 80%",
          },
        })
      }
    })

    return () => ctx.revert()
  }, [])

  // Idle detection
  useEffect(() => {
    let idleTimer

    const resetTimer = () => {
      setIsIdle(false)
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => setIsIdle(true), 4000)
    }

    const events = ["mousemove", "keydown", "scroll", "touchstart"]
    events.forEach((event) => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer))
      clearTimeout(idleTimer)
    }
  }, [])

  return (
    <section className="relative min-h-[400px] flex items-center justify-center py-24 lg:py-32 overflow-hidden">
      {/* Background Gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at center, var(--accent-glow) 0%, var(--background) 70%)" }}
      />

      {/* Grain Overlay */}
      <div className="grain-overlay" style={{ opacity: 0.025 }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Morphing Text for dynamic effect */}
        <div className="mb-6">
          <MorphingText
            texts={["Your Rules", "Your Brand", "Your Identity"]}
            className="text-foreground h-12 md:h-16 lg:h-20 lg:text-[4rem]"
          />
        </div>

        {/* Headline */}
        <h2
          ref={headlineRef}
          className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] font-bold text-foreground mb-6"
        >
          <span className="word inline-block">Your</span>{" "}
          <span className="word inline-block">domain.</span>{" "}
          <span className="word inline-block">Your</span>{" "}
          <span className="word inline-block">emails.</span>{" "}
          <span className="word inline-block">Your</span>{" "}
          <span className="word inline-block gradient-text">way.</span>
        </h2>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-foreground-dim text-lg mb-10 max-w-xl mx-auto"
        >
          Set up in under 2 minutes. No credit card required.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <MotionLink
            href="/register"
            animate={
              isIdle
                ? {
                  boxShadow: [
                    "0 0 20px var(--accent-glow)",
                    "0 0 50px var(--accent-glow)",
                    "0 0 20px var(--accent-glow)",
                  ],
                }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{
              backgroundColor: "var(--primary-hover)",
              boxShadow: "0 0 24px var(--accent-glow)"
            }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-base transition-colors inline-flex items-center justify-center gap-2"
          >
            Get Started Free
            <ArrowRight size={18} />
          </MotionLink>
          <motion.a
            href="#how-it-works"
            whileHover={{ borderColor: "var(--primary)" }}
            className="border border-border text-foreground px-6 py-3 rounded-lg font-medium text-base transition-all inline-flex items-center justify-center"
          >
            See How It Works
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
