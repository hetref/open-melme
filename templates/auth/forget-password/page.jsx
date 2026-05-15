"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] relative"
      >
        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,0,0,0.06)]">
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Forgot Password
                </h1>
                <p className="text-muted text-sm leading-relaxed">
                  Enter your email address and we&apos;ll send you a link to reset your password
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    "Send Reset Email"
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#22c55e]" />
              </div>
              <h2 className="font-[var(--font-display)] text-xl font-bold text-foreground mb-2">
                Check Your Email
              </h2>
              <p className="text-muted text-sm mb-6">
                We&apos;ve sent a password reset link to <span className="text-foreground font-medium">{email}</span>
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail("")
                }}
                className="text-sm text-accent-light hover:text-primary font-medium transition-colors"
              >
                Didn&apos;t receive the email? Try again
              </button>
            </motion.div>
          )}

          {/* Footer Links */}
          <div className="space-y-2 mt-6 text-center">
            <p className="text-sm text-muted">
              Remember your password?{" "}
              <Link href="/login" className="text-accent-light hover:text-primary font-medium transition-colors">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-accent-light hover:text-primary font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}