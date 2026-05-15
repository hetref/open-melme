import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import React from 'react'
import ChangePasswordForm from './ChangePasswordForm'
import SetPasswordForm from './SetPasswordForm'
import { Badge } from '@/components/ui/badge'
import { TwoFactorAuth } from './TwoFactorAuth'
import { PasskeyManagement } from './PasskeyManagement'

const SecurityTab = async ({ email, isTwoFactorEnabled }) => {

  const [passkeys, accounts] = await Promise.all([
    auth.api.listPasskeys({ headers: await headers() }),
    auth.api.listUserAccounts({ headers: await headers() }),
  ])
  const hasPasswordAccounts = accounts.some(a => a.providerId === 'credential')

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-2">Security</h2>
      <p className="text-foreground-dim text-sm mb-6">Manage your password, 2FA, and passkeys.</p>

      <div className='space-y-4'>
        {
          hasPasswordAccounts ? (
            <Card className="bg-surface border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Change Password</CardTitle>
                <CardDescription className="text-foreground-dim">
                  You can change your account password associated with {email}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChangePasswordForm />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-surface border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Set Password</CardTitle>
                <CardDescription className="text-foreground-dim">
                  You can set a password for your account associated with {email}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SetPasswordForm email={email} />
              </CardContent>
            </Card>
          )
        }

        {hasPasswordAccounts && (
          <Card className="bg-surface border border-border">
            <CardHeader className="flex items-center justify-between gap-2">
              <CardTitle className="text-foreground">Two-Factor Authentication</CardTitle>
              <Badge variant={isTwoFactorEnabled ? "default" : "secondary"}>
                {isTwoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </CardHeader>
            <CardContent>
              <TwoFactorAuth isEnabled={isTwoFactorEnabled} />
            </CardContent>
          </Card>
        )}

        <Card className="bg-surface border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Passkeys</CardTitle>
          </CardHeader>
          <CardContent>
            <PasskeyManagement passkeys={passkeys} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SecurityTab