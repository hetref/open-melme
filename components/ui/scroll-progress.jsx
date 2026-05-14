"use client"

import { motion, useScroll } from "framer-motion"

import { cn } from "@/lib/utils"

export function ScrollProgress({
  className,
  ref,
  containerWidth,
  ...props
}) {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      ref={ref}
      className={cn(
        "h-[2px] origin-left bg-gradient-to-r from-primary via-accent-light to-primary",
        className
      )}
      style={{
        scaleX: scrollYProgress,
        width: containerWidth || "100%",
      }}
      {...props}
    />
  )
}
