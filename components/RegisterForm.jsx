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
import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { motion } from "framer-motion"
import PasskeyButton from "./PasskeyButton"
import { useEffect, useState } from "react"

const registerSchema = z.object({
	name: z.string().min(2).max(100),
	email: z.email(),
	password: z.string().min(6, "Password must be at least 6 characters long"),
})

const RegisterForm = () => {
	const router = useRouter()
	const [isRegistrationAllowed, setIsRegistrationAllowed] = useState(true)
	const [isCheckingStatus, setIsCheckingStatus] = useState(true)

	const form = useForm({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: ""
		}
	})

	useEffect(() => {
		// Check if registration is allowed
		const checkStatus = async () => {
			try {
				const response = await fetch('/api/status')
				const data = await response.json()
				setIsRegistrationAllowed(data.isRegistrationAllowed)
			} catch (error) {
				console.error('Error checking registration status:', error)
			} finally {
				setIsCheckingStatus(false)
			}
		}

		checkStatus()
	}, [])

	const handleRegister = async (data) => {
		if (!isRegistrationAllowed) {
			toast.error("New user registration is currently disabled. Please contact support.")
			return
		}

		await authClient.signUp.email(
			{ ...data, callbackURL: "/" },
			{
				onError: (error) => {
					toast.error(error.error.message || "Registration failed")
				},
				onSuccess: () => {
					toast.success("Registration successful! Please check your email to verify your account.")
					router.push("/")
				}
			}
		)
		await new Promise((resolve) => setTimeout(resolve, 2000))
	}

	if (isCheckingStatus) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-[420px] relative"
			>
				<div className="bg-surface border border-border rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,0,0,0.06)]">
					<div className="text-center">
						<p className="text-muted">Loading...</p>
					</div>
				</div>
			</motion.div>
		)
	}

	if (!isRegistrationAllowed) {
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

					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
							<Lock className="w-8 h-8 text-orange-600" />
						</div>
						<h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-foreground mb-2">
							Registration Disabled
						</h1>
						<p className="text-muted">New user registration is currently disabled.</p>
					</div>

					<div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-6">
						<h3 className="font-semibold text-foreground mb-2">Existing Users</h3>
						<p className="text-foreground-dim text-sm mb-4">
							If you already have an account, you can still sign in and access all features.
						</p>
						<Link href="/login">
							<Button className="w-full" variant="default">
								Go to Login
							</Button>
						</Link>
					</div>

					<div className="bg-surface-raised border border-border rounded-xl p-6">
						<h3 className="font-semibold text-foreground mb-2">Need Access?</h3>
						<p className="text-foreground-dim text-sm mb-4">
							If you need to create a new account, please contact our support team for assistance.
						</p>
						<a
							href="mailto:contact@aryanshinde.in"
							className="inline-block w-full text-center px-4 py-2 bg-surface border border-border text-foreground rounded-lg hover:bg-surface-raised transition-colors"
						>
							Contact Support
						</a>
					</div>
				</div>
			</motion.div>
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
						Create Account
					</h1>
					<p className="text-muted text-sm">Sign up to get started with MelMe</p>
				</div>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleRegister)} className="space-y-5">
						<FormField control={form.control} name="name" render={({ field }) => (
							<FormItem>
								<FormLabel>Full Name</FormLabel>
								<FormControl>
									<Input placeholder="Enter your full name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)} />

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
									<Input type="password" placeholder="Create a password (min. 6 characters)" {...field} />
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
								form.formState.isSubmitting ? "Creating account..." : "Create Account"
							}
						</Button>
					</form>
				</Form>

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
					Already have an account?{" "}
					<Link href="/login" className="text-accent-light hover:text-primary font-medium transition-colors">
						Sign in
					</Link>
				</div>
			</div>
		</motion.div>
	)
}

export default RegisterForm