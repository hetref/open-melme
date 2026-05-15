import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail, sendDeleteAccountVerificationEmail } from "./email"
import { createAuthMiddleware } from "better-auth/api"
import { twoFactor, openAPI } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey"
import prisma from "./prisma"
import { isMaintenanceMode, isRegistrationAllowed } from "./maintenance"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL,
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, url, newEmail }) => {
        await sendVerificationEmail({
          to: newEmail,
          verificationUrl: url
        })
      }
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendDeleteAccountVerificationEmail({ user, url })
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        to: user.email,
        resetPasswordUrl: url
      })
    }
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        verificationUrl: url
      })
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    nextCookies(),
    twoFactor({
      issuer: "MelMe",
    }),
    openAPI(),
    passkey(),
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  hooks: {
    before: createAuthMiddleware(async ctx => {
      // Block all authentication during maintenance mode
      if (isMaintenanceMode()) {
        throw new Error("System is currently under maintenance. Please try again later.")
      }

      // Block registration when not allowed
      if (ctx.path.startsWith("/sign-up")) {
        if (!isRegistrationAllowed()) {
          throw new Error("New user registration is currently disabled. Please contact support if you need access.")
        }
      }
    }),
    after: createAuthMiddleware(async ctx => {
      // Send welcome email on sign-up
      if (ctx.path.startsWith("/sign-up")) {
        const user = ctx.context.newSession?.user ?? { name: ctx.body.name, email: ctx.body.email }
        if (user != null) {
          await sendWelcomeEmail({
            to: user.email,
            name: user.name
          })
        }
      }
    })
  }
})
