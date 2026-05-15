"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Key,
  Camera,
  Check,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock user data
const userData = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  joinDate: "January 2024",
  plan: "Pro",
  avatar: null,
  twoFactorEnabled: true,
  emailNotifications: true,
  marketingEmails: false,
}

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    location: userData.location,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Profile Settings
        </h1>
        <p className="text-foreground-dim text-sm sm:text-base">
          Manage your account information and preferences
        </p>
      </motion.div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {userData.avatar ? (
                  <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-semibold text-primary">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <button className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-foreground" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
                    {userData.name}
                  </h2>
                  <p className="text-foreground-dim text-sm">{userData.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {userData.plan} Plan
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-foreground-dim">
                  <Calendar size={16} className="text-muted" />
                  <span>Joined {userData.joinDate}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground-dim">
                  <MapPin size={16} className="text-muted" />
                  <span>{userData.location}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]"
        >
          <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground mb-6">
            Personal Information
          </h3>

          <div className="grid gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-raised border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface-raised border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>

            {/* Phone & Location Row */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-surface-raised border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-surface-raised border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex items-center justify-end gap-3">
            {saveSuccess && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-sm text-[#22c55e]"
              >
                <Check size={16} />
                Changes saved
              </motion.span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                "bg-primary text-primary-foreground hover:bg-primary-hover",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]"
        >
          <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground mb-6">
            Security
          </h3>

          <div className="space-y-4">
            {/* Two-Factor Auth */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-raised">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-xs text-muted">Add an extra layer of security to your account</p>
                </div>
              </div>
              <ToggleSwitch enabled={userData.twoFactorEnabled} />
            </div>

            {/* Change Password */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-raised">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Key size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Password</p>
                  <p className="text-xs text-muted">Last changed 30 days ago</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
                Change
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]"
        >
          <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground mb-6">
            Notifications
          </h3>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-raised">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted">Receive email updates about your account activity</p>
                </div>
              </div>
              <ToggleSwitch enabled={userData.emailNotifications} />
            </div>

            {/* Marketing Emails */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-raised">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Marketing Emails</p>
                  <p className="text-xs text-muted">Receive updates about new features and offers</p>
                </div>
              </div>
              <ToggleSwitch enabled={userData.marketingEmails} />
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface border border-destructive/20 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)]"
        >
          <h3 className="font-[var(--font-display)] text-lg font-semibold text-destructive mb-2">
            Danger Zone
          </h3>
          <p className="text-foreground-dim text-sm mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button className="px-4 py-2 text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 rounded-lg transition-colors">
            Delete Account
          </button>
        </motion.div>
      </div>
    </div>
  )
}

// Toggle Switch Component
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange?: () => void }) {
  const [isEnabled, setIsEnabled] = useState(enabled)

  const toggle = () => {
    setIsEnabled(!isEnabled)
    onChange?.()
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors",
        isEnabled ? "bg-primary" : "bg-surface-raised border border-border"
      )}
    >
      <motion.div
        animate={{ x: isEnabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute top-1 w-4 h-4 rounded-full",
          isEnabled ? "bg-primary-foreground" : "bg-muted"
        )}
      />
    </button>
  )
}