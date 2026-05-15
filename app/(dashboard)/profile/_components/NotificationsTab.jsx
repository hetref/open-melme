"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const NotificationToggle = ({
  label,
  description,
  icon: Icon,
  enabled,
  onChange,
  disabled,
}) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-raised border border-border/60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  )
}

const ToggleSwitch = ({ enabled, onChange, disabled }) => {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!enabled)}
      disabled={disabled}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors",
        enabled ? "bg-primary" : "bg-surface border border-border",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute top-1 w-4 h-4 rounded-full",
          enabled ? "bg-primary-foreground" : "bg-muted"
        )}
      />
    </button>
  )
}

const NotificationsTab = ({
  emailNotifications = true,
  marketingEmails = false,
}) => {
  const [emailEnabled, setEmailEnabled] = useState(emailNotifications)
  const [marketingEnabled, setMarketingEnabled] = useState(marketingEmails)
  const [isSaving, setIsSaving] = useState(false)

  const savePreferences = async (nextEmail, nextMarketing) => {
    const previousEmail = emailEnabled
    const previousMarketing = marketingEnabled
    setEmailEnabled(nextEmail)
    setMarketingEnabled(nextMarketing)
    setIsSaving(true)
    try {
      const response = await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailNotifications: nextEmail,
          marketingEmails: nextMarketing,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update preferences")
      }

      const payload = await response.json()
      setEmailEnabled(payload.data.emailNotifications)
      setMarketingEnabled(payload.data.marketingEmails)
      toast.success("Notification preferences updated")
    } catch (error) {
      setEmailEnabled(previousEmail)
      setMarketingEnabled(previousMarketing)
      toast.error("Unable to update notification preferences")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Notifications
      </h2>
      <p className="text-foreground-dim text-sm mb-6">
        Manage how we keep you informed about your account.
      </p>

      <div className="space-y-4">
        <NotificationToggle
          label="Email Notifications"
          description="Receive email updates about your account activity"
          icon={Bell}
          enabled={emailEnabled}
          disabled={isSaving}
          onChange={(nextValue) => savePreferences(nextValue, marketingEnabled)}
        />
        <NotificationToggle
          label="Marketing Emails"
          description="Receive product updates and announcements"
          icon={Mail}
          enabled={marketingEnabled}
          disabled={isSaving}
          onChange={(nextValue) => savePreferences(emailEnabled, nextValue)}
        />
      </div>
    </div>
  )
}

export default NotificationsTab
