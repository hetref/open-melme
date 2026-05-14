"use client"

import React, { useState, useEffect, useRef, createContext, useContext } from "react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const NavbarContext = createContext < NavbarContextType > ({
  isScrolled: false,
  navbarWidth: "100%"
})

export const useNavbar = () => useContext(NavbarContext)

export function Navbar({ children, className }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [navbarWidth, setNavbarWidth] = useState("100%")
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 60) {
      setIsScrolled(true)
      setNavbarWidth("fit-content")
    } else {
      setIsScrolled(false)
      setNavbarWidth("100%")
    }
  })

  return (
    <NavbarContext.Provider value={{ isScrolled, navbarWidth }}>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex justify-center",
          className
        )}
      >
        {children}
      </motion.nav>
    </NavbarContext.Provider>
  )
}

export function NavBody({ children, className }) {
  const { isScrolled } = useNavbar()

  return (
    <motion.div
      initial={false}
      animate={{
        width: isScrolled ? "auto" : "100%",
        maxWidth: isScrolled ? "700px" : "100%",
        marginTop: isScrolled ? 16 : 0,
        paddingLeft: isScrolled ? 24 : 24,
        paddingRight: isScrolled ? 24 : 24,
        borderRadius: isScrolled ? 9999 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 40,
      }}
      className={cn(
        "flex items-center justify-between py-3 transition-colors duration-300",
        isScrolled
          ? "bg-surface/90 backdrop-blur-xl border border-border shadow-lg"
          : "bg-background/50 backdrop-blur-sm border-b border-transparent",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export function NavItems({ items, className, onItemClick }) {
  const { isScrolled } = useNavbar()

  return (
    <div className={cn("hidden md:flex items-center gap-1", className)}>
      {items.map((item) => (
        <motion.a
          key={item.name}
          href={item.link}
          onClick={onItemClick}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors rounded-full",
            "text-foreground-dim hover:text-foreground hover:bg-surface-raised/50"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {item.name}
        </motion.a>
      ))}
    </div>
  )
}

export function MobileNav({ children, className }) {
  return (
    <div className={cn("md:hidden", className)}>
      {children}
    </div>
  )
}

export function MobileNavHeader({ children, className }) {
  return (
    <div className={cn("flex items-center justify-between w-full px-4 py-3", className)}>
      {children}
    </div>
  )
}

export function MobileNavToggle({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-foreground hover:bg-surface-raised rounded-lg transition-colors"
      aria-label="Toggle menu"
    >
      {isOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  )
}

export function MobileNavMenu({ children, className, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed top-[72px] left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-border",
            className
          )}
        >
          <div className="px-6 py-6 flex flex-col gap-2">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function NavbarButton({
  children,
  href,
  variant = "primary",
  className,
  as: Component = "a",
  ...props
}) {
  const baseStyles = "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"

  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-[0_0_24px_var(--accent-glow)]",
    secondary: "border border-border text-foreground hover:bg-surface-raised",
    dark: "bg-foreground text-background hover:opacity-90",
    gradient: "bg-gradient-to-r from-primary to-accent-light text-white hover:opacity-90",
  }

  return (
    <Component
      href={href}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </Component>
  )
}

export function NavbarLogo({ children, className }) {
  return (
    <motion.a
      href="#"
      className={cn(
        "font-[var(--font-display)] text-xl font-bold text-foreground",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.a>
  )
}
