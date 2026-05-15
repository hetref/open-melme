"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "./ui/button"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import GoogleAuthButton from "./GoogleAuthButton"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import PasskeyButton from "./PasskeyButton"

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
})

const LoginForm = () => {
  const [errorCode, setErrorCode] = useState(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  const handleLogin = async (data) => {
    await authClient.signIn.email(
      { ...data, callbackURL: "/domains" },
      {
        onError: (error) => {
          toast.error(error.error.message || "Login failed")
          console.error("Login error:", error)
          setErrorCode(error.error.code)
        },
        onSuccess: () => {
          toast.success("Login successful! Welcome back.")
          router.push("/domains")
        }
      }
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[420px] relative"
    >
      <div className="bg-surface border border-border rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,0,0,0.06)]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted text-sm">
            Sign in to your account to continue
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-5">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end">
              <Link href="/forget-password" className="text-sm text-accent-light hover:text-primary font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {
                form.formState.isSubmitting ? "Logging in..." : "Login"
              }
            </Button>
          </form>
        </Form>

        {
          errorCode === "EMAIL_NOT_VERIFIED" && (
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  setIsSendingEmail(true)
                  try {
                    await authClient.sendVerificationEmail({
                      email: form.getValues("email"),
                      callbackURL: "/"
                    })
                    toast.success("Verification email sent! Please check your inbox.")
                  } catch (error) {
                    toast.error("Failed to send verification email. Please try again.")
                    console.error("Verification email error:", error)
                  } finally {
                    setIsSendingEmail(false)
                    setErrorCode(null)
                  }
                }}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? "Sending verification email..." : "Resend Verification Email"}
              </Button>
            </div>
          )
        }

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface px-4 text-muted uppercase tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleAuthButton />
        <PasskeyButton />

        <div className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent-light hover:text-primary font-medium transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default LoginForm