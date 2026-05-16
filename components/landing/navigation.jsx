"use client"

import { useEffect, useState } from "react"
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"

const navLinks = [
  { name: "Features", link: "#features", inpage: true },
  { name: "How It Works", link: "#how-it-works", inpage: true },
  { name: "Security", link: "#security", inpage: true },
  { name: "My Mailbox", link: "/my-mailbox", inpage: false },
]

const MotionLink = motion(Link)

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { scrollY, scrollYProgress } = useScroll()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return
    gsap.registerPlugin(ScrollToPlugin)
  }, [])

  const progress = useTransform(scrollY, [0, 140], [0, 1])
  const smoothProgress = useSpring(progress, {
    stiffness: 240,
    damping: 32,
    mass: 0.6,
  })

  const navPaddingX = useTransform(smoothProgress, [0, 1], [0, 24])
  const navPaddingTop = useTransform(smoothProgress, [0, 1], [0, 24])
  const containerRadius = useTransform(smoothProgress, [0, 1], [0, 16])
  const containerMaxWidth = useTransform(smoothProgress, [0, 1], ["100%", "90rem"])
  const containerShadow = useTransform(
    smoothProgress,
    [0, 1],
    ["0 0 0 rgba(0,0,0,0)", "0 8px 32px 0 rgba(0,0,0,0.12)"]
  )
  const contentPaddingX = useTransform(smoothProgress, [0, 1], [24, 16])

  const handleSectionClick = (event, href, inpage) => {
    event.preventDefault()
    if (!inpage) {
      setMobileMenuOpen(false)
      router.push(href)
      return
    }
    const id = href.replace("#", "")
    const target = document.getElementById(id)
    if (!target) return

    setMobileMenuOpen(false)
    gsap.to(window, {
      duration: 0.9,
      ease: "power2.out",
      scrollTo: {
        y: target,
        offsetY: 96,
      },
    })
  }

  return (
    <>
      {/* Main Navbar - Always visible, transforms to floating on scroll */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          paddingLeft: navPaddingX,
          paddingRight: navPaddingX,
          paddingTop: navPaddingTop,
        }}
        className={cn("fixed top-0 left-0 right-0 z-50 flex justify-center")}
      >
        {/* NavBody Container - full width initially, transforms on scroll */}
        <motion.div
          initial={false}
          animate={{
            borderRadius: containerRadius,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 40,
          }}
          style={{
            maxWidth: containerMaxWidth,
            boxShadow: containerShadow,
            borderRadius: containerRadius,
          }}
          className={cn(
            "w-full flex flex-col overflow-hidden backdrop-blur-xl"
          )}
        >
          {/* Nav Content Row */}
          <motion.div
            style={{
              paddingLeft: contentPaddingX,
              paddingRight: contentPaddingX,
            }}
            className={cn(
              "flex items-center justify-between py-6 max-w-7xl mx-auto w-full"
            )}
          >
            {/* Logo */}
            <motion.a
              href="/"
              className="font-[var(--font-display)] text-xl font-bold text-foreground flex items-center gap-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src="/accent-logo-shield.png"
                alt="MelMe Logo"
                width={1000}
                height={1000}
                className="h-14 w-auto object-contain dark:hidden"
              />
              <Image
                src="/accent-logo-text.png"
                alt="MelMe Logo"
                width={1000}
                height={1000}
                className="h-14 w-auto object-contain dark:hidden"
              />
              <Image
                src="/glassmorphism-logo-shield.png"
                alt="MelMe Logo"
                width={1000}
                height={1000}
                className="hidden h-14 w-auto object-contain dark:block"
              />
            </motion.a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <motion.button
                  key={link.name}
                  type="button"
                  onClick={(event) => handleSectionClick(event, link.link, link.inpage)}
                  className="px-4 py-2 text-sm font-medium transition-colors rounded-full text-foreground-dim hover:text-foreground hover:bg-surface-raised/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {link.name}
                </motion.button>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <AnimatedThemeToggler />
              <MotionLink
                href="/login"
                className="text-foreground-dim hover:text-foreground transition-colors text-sm font-medium px-3 py-2"
                whileHover={{ scale: 1.02 }}
              >
                Log In
              </MotionLink>
              <MotionLink
                href="/register"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-hover hover:shadow-[0_0_24px_var(--accent-glow)] transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started Free
              </MotionLink>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-3 md:hidden">
              <AnimatedThemeToggler />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-foreground hover:bg-surface-raised rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </motion.div>

          {/* Scroll Progress Bar - attached to bottom of navbar */}
          <div className="w-full h-[2px] bg-border/30">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-primary via-accent-light to-primary"
              style={{
                scaleX: scrollYProgress,
              }}
            />
          </div>
        </motion.div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-border md:hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.name}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={(event) => handleSectionClick(event, link.link)}
                  className="text-foreground-dim hover:text-foreground transition-colors text-base font-medium py-3 px-4 rounded-lg hover:bg-surface-raised"
                >
                  {link.name}
                </motion.button>
              ))}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border">
                <Link
                  href="/login"
                  className="text-foreground-dim hover:text-foreground transition-colors text-base font-medium py-3 px-4 text-center"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-primary text-primary-foreground px-4 py-3 rounded-full text-base font-medium text-center"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
