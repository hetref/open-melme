"use client"

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import React from 'react'
import { toast } from 'sonner'

const DangerTab = () => {

  const deleteUserHandler = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.")
    if (!confirmed) return

    await authClient.deleteUser({ callbackURL: "/" })
    toast.success("Please confirm the account deletion via the email sent to you!")
  }
  return (
    <div>
      <h2 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
      <p className="text-foreground-dim text-sm mb-6">
        Permanently delete your account and all associated data.
      </p>

      <div>
        <Button onClick={deleteUserHandler} variant='destructive' className="w-full">Delete Your Account</Button>
      </div>
    </div >
  )
}

export default DangerTab