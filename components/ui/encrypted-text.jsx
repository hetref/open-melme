"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function EncryptedText({
  text,
  className,
  revealDelayMs = 50,
  flipDelayMs = 50,
  charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?",
  encryptedClassName,
  revealedClassName,
}) {
  const [displayText, setDisplayText] = useState("")
  const [revealedCount, setRevealedCount] = useState(0)
  const intervalRef = useRef(null)
  const revealIntervalRef = useRef(null)

  useEffect(() => {
    // Start revealing characters one by one
    revealIntervalRef.current = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= text.length) {
          if (revealIntervalRef.current) {
            clearInterval(revealIntervalRef.current)
          }
          return prev
        }
        return prev + 1
      })
    }, revealDelayMs)

    return () => {
      if (revealIntervalRef.current) {
        clearInterval(revealIntervalRef.current)
      }
    }
  }, [text, revealDelayMs])

  useEffect(() => {
    // Flip unrevealed characters randomly
    intervalRef.current = setInterval(() => {
      setDisplayText(() => {
        return text
          .split("")
          .map((char, index) => {
            if (index < revealedCount) {
              return char
            }
            if (char === " ") {
              return " "
            }
            return charset[Math.floor(Math.random() * charset.length)]
          })
          .join("")
      })
    }, flipDelayMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [text, revealedCount, flipDelayMs, charset])

  return (
    <span className={cn("inline", className)}>
      {displayText.split("").map((char, index) => (
        <span
          key={index}
          className={cn(
            index < revealedCount ? revealedClassName : encryptedClassName
          )}
        >
          {char}
        </span>
      ))}
    </span>
  )
}
