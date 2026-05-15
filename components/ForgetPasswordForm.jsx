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
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

const forgetPasswordSchema = z.object({
  email: z.email(),
})

const ForgetPasswordForm = () => {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: {
      email: "",
    }
  })

  const handleForgetPassword = async (data) => {
    await authClient.requestPasswordReset(
      { ...data, redirectTo: "/reset-password" },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to send reset email")
          console.error("Reset password error:", error)
        },
        onSuccess: () => {
          toast.success("Password reset email sent! Please check your email.")
          router.push("/")
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
            Forgot Password
          </h1>
          <p className="text-muted text-sm">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleForgetPassword)} className="space-y-5">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button
              type="submit"
              className="w-full rounded-xl"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {
                form.formState.isSubmitting ? "Sending reset email..." : "Send Reset Email"
              }
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center space-y-2">
          <div className="text-sm text-muted">
            Remember your password?{" "}
            <Link href="/login" className="text-accent-light hover:text-primary font-medium transition-colors">
              Sign in
            </Link>
          </div>
          <div className="text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-accent-light hover:text-primary font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ForgetPasswordForm