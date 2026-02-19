import { createAuthClient } from "better-auth/react"
import { twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = "/2fa"
      },
    }),
    passkeyClient(),
  ]
})