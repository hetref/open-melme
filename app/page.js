"use client"

import { useEffect } from "react"
import { Navigation } from "@/components/landing/navigation"
import { Hero } from "@/components/landing/hero"
import { TrustMarquee } from "@/components/landing/trust-marquee"
import { PainSolution } from "@/components/landing/pain-solution"
import { FeatureGrid } from "@/components/landing/feature-grid"
import { HowItWorks } from "@/components/landing/how-it-works"
import { MailboxShowcase } from "@/components/landing/mailbox-showcase"
import { Security } from "@/components/landing/security"
import { Pricing } from "@/components/landing/pricing"
import { FinalCTA } from "@/components/landing/final-cta"
import { Footer } from "@/components/landing/footer"
import { SmoothCursor } from "@/components/ui/smooth-cursor"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollSmoother } from "gsap/ScrollSmoother"

export default function MelMeLanding() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

    // Initialize ScrollSmoother
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.4,
      effects: true,
      smoothTouch: 0.1,
    })

    // Apply parallax to elements with data-speed
    const elements = document.querySelectorAll("[data-speed]")
    elements.forEach((el) => {
      const speed = parseFloat(el.getAttribute("data-speed") || "1")
      smoother.effects(el, { speed })
    })

    return () => {
      smoother.kill()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <>
      {/* Smooth Cursor - only on landing page */}
      <SmoothCursor />

      {/* Grain Overlay */}
      <div className="grain-overlay" />

      <Navigation />

      <div id="smooth-wrapper" className="cursor-none">
        <div id="smooth-content">
          <main>
            <Hero />
            <TrustMarquee />
            <PainSolution />
            <FeatureGrid />
            <HowItWorks />
            <MailboxShowcase />
            <Security />
            <Pricing />
            <FinalCTA />
          </main>

          <Footer />
        </div>
      </div>
    </>
  )
}
