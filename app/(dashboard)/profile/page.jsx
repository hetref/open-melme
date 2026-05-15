import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import React, { Suspense } from 'react'
import ProfileUpdateTab from './_components/ProfileUpdateTab'
import SecurityTab from './_components/SecurityTab'
import SessionsTab from './_components/SessionsTab'
import AccountsTab from './_components/AccountsTab'
import DangerTab from './_components/DangerTab'
import NotificationsTab from './_components/NotificationsTab'
import { Loader2Icon } from 'lucide-react'
import prisma from '@/lib/prisma'

const page = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session === null) return redirect('/login')
  // else console.log("SESSION:", session)

  const notificationPrefs = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailNotifications: true, marketingEmails: true },
  })

  const userInitials = session.user?.name
    ? session.user.name
        .split(" ")
        .map(name => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U"
  const joinedDate = session.user?.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Profile Settings
        </h1>
        <p className="text-foreground-dim text-sm sm:text-base">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="relative">
              {session.user?.image ? (
                <img
                  src={session.user.image.trim()}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl font-semibold text-primary">
                    {userInitials}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
                    {session.user.name}
                  </h2>
                  <p className="text-foreground-dim text-sm">{session.user.email}</p>
                </div>
              </div>

              {joinedDate && (
                <p className="text-sm text-foreground-dim">Joined {joinedDate}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]">
          <ProfileUpdateTab user={session.user} />
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]">
          <LoadingSuspense>
            <SecurityTab email={session.user.email} isTwoFactorEnabled={session.user.twoFactorEnabled ?? false} />
          </LoadingSuspense>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]">
          <LoadingSuspense>
            <SessionsTab currentSessionToken={session.session.token} />
          </LoadingSuspense>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]">
          <LoadingSuspense>
            <AccountsTab />
          </LoadingSuspense>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]">
          <NotificationsTab
            emailNotifications={notificationPrefs?.emailNotifications ?? true}
            marketingEmails={notificationPrefs?.marketingEmails ?? false}
          />
        </div>

        <div className="bg-surface border border-destructive/20 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]">
          <LoadingSuspense>
            <DangerTab />
          </LoadingSuspense>
        </div>
      </div>
    </div>
  )
}

export default page

export const LoadingSuspense = ({ children }) => {
  return (
    <Suspense fallback={<Loader2Icon className='size-20 animate-spin' />}>
      {children}
    </Suspense>
  )
}