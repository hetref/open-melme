"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Database,
    Key,
    Lock,
    LogOut,
    Mail,
    RefreshCw,
    Shield,
    Trash2,
    XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

const MAX_TAGS = 20
const MAX_TAG_LENGTH = 30

function parseTagsInput(inputValue) {
    const parts = inputValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

    const tags = []
    const seen = new Set()

    for (const part of parts) {
        if (part.length > MAX_TAG_LENGTH) {
            return { error: `Each tag must be ${MAX_TAG_LENGTH} characters or less` }
        }

        const canonical = part.toLowerCase()
        if (!seen.has(canonical)) {
            seen.add(canonical)
            tags.push(part)
        }
    }

    if (tags.length > MAX_TAGS) {
        return { error: `A mailbox can have at most ${MAX_TAGS} tags` }
    }

    return { tags }
}

function formatAlias(alias) {
    return `${alias.localPart}@${alias.domain?.fullDomain || 'N/A'}`
}

const SingleMailboxPage = () => {
    const router = useRouter()
    const params = useParams()
    const mailboxId = params.mailboxId

    const [mailbox, setMailbox] = useState(null)
    const [sessions, setSessions] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [refreshingSessions, setRefreshingSessions] = useState(false)
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const [settingsData, setSettingsData] = useState({
        name: '',
        senderName: '',
        personalEmail: '',
        tags: [],
        description: '',
    })
    const [tagsInput, setTagsInput] = useState('')
    const [deleteConfirmation, setDeleteConfirmation] = useState('')

    useEffect(() => {
        if (mailboxId) {
            fetchMailbox()
            fetchSessions()
            fetchStats()
        }
    }, [mailboxId])

    const fetchMailbox = async () => {
        try {
            const response = await fetch(`/api/mailboxes/${mailboxId}`)
            if (!response.ok) {
                if (response.status === 404) {
                    toast.error('Mailbox not found')
                    router.push('/mailboxes')
                    return
                }
                throw new Error('Failed to fetch mailbox')
            }

            const data = await response.json()
            setMailbox(data.mailbox)

            const resolvedPersonalEmail =
                data.mailbox.personalEmail || data.mailbox.assignedPersonalEmails?.[0] || ''
            const resolvedTags = data.mailbox.tags || []

            setSettingsData({
                name: data.mailbox.name || '',
                senderName: data.mailbox.senderName || '',
                personalEmail: resolvedPersonalEmail,
                tags: resolvedTags,
                description: data.mailbox.description || '',
            })
            setTagsInput(resolvedTags.join(', '))
        } catch (error) {
            console.error('Error fetching mailbox:', error)
            toast.error('Failed to load mailbox')
        } finally {
            setLoading(false)
        }
    }

    const fetchSessions = async () => {
        try {
            const response = await fetch(`/api/mailboxes/${mailboxId}/sessions`)
            if (response.ok) {
                const data = await response.json()
                setSessions(data.sessions || [])
            }
        } catch (error) {
            console.error('Error fetching sessions:', error)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/mailboxes/${mailboxId}/stats`)
            if (response.ok) {
                const data = await response.json()
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const handleRefreshSessions = async () => {
        setRefreshingSessions(true)
        try {
            await fetchSessions()
            toast.success('Sessions refreshed')
        } catch (error) {
            toast.error('Failed to refresh sessions')
        } finally {
            setRefreshingSessions(false)
        }
    }

    const handleToggleStatus = async () => {
        try {
            const response = await fetch(`/api/mailboxes/${mailboxId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isActive: !mailbox.isActive,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update mailbox status')
            }

            const data = await response.json()
            setMailbox(data.mailbox)
            toast.success(`Mailbox ${data.mailbox.isActive ? 'activated' : 'deactivated'}`)
        } catch (error) {
            console.error('Error updating mailbox:', error)
            toast.error('Failed to update mailbox status')
        }
    }

    const handleSaveSettings = async (e) => {
        e.preventDefault()

        if (!settingsData.name.trim()) {
            toast.error('Mailbox name is required')
            return
        }

        if (!settingsData.senderName.trim()) {
            toast.error('Sender name is required')
            return
        }

        if (!settingsData.personalEmail.trim()) {
            toast.error('Personal email is required')
            return
        }

        const personalEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!personalEmailRegex.test(settingsData.personalEmail.trim())) {
            toast.error('Personal email is invalid')
            return
        }

        const parsedTags = parseTagsInput(tagsInput)
        if (parsedTags.error) {
            toast.error(parsedTags.error)
            return
        }

        setIsSavingSettings(true)

        try {
            const response = await fetch(`/api/mailboxes/${mailboxId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: settingsData.name.trim(),
                    senderName: settingsData.senderName.trim(),
                    personalEmail: settingsData.personalEmail.trim().toLowerCase(),
                    tags: parsedTags.tags,
                    description: settingsData.description.trim() || null,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update settings')
            }

            const data = await response.json()
            setMailbox(data.mailbox)
            setSettingsData({
                name: data.mailbox.name || '',
                senderName: data.mailbox.senderName || '',
                personalEmail:
                    data.mailbox.personalEmail || data.mailbox.assignedPersonalEmails?.[0] || '',
                tags: data.mailbox.tags || [],
                description: data.mailbox.description || '',
            })
            setTagsInput((data.mailbox.tags || []).join(', '))
            toast.success('Settings updated successfully')
        } catch (error) {
            console.error('Error updating settings:', error)
            toast.error(error.message)
        } finally {
            setIsSavingSettings(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('All fields are required')
            return
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match')
            return
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        if (passwordData.newPassword === passwordData.currentPassword) {
            toast.error('New password must be different from current password')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/mailboxes/${mailboxId}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(passwordData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change password')
            }

            toast.success('Password changed successfully!')
            setIsChangePasswordDialogOpen(false)
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
            fetchSessions()
        } catch (error) {
            console.error('Error changing password:', error)
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRevokeSession = async (sessionId) => {
        try {
            const response = await fetch(`/api/mailboxes/${mailboxId}/sessions/${sessionId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to revoke session')
            }

            toast.success('Session revoked')
            fetchSessions()
        } catch (error) {
            console.error('Error revoking session:', error)
            toast.error('Failed to revoke session')
        }
    }

    const handleDeleteMailbox = async (e) => {
        e.preventDefault()

        if (deleteConfirmation !== mailbox.name) {
            toast.error('Mailbox name does not match')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/mailboxes/${mailboxId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete mailbox')
            }

            toast.success('Mailbox deleted successfully')
            router.push('/mailboxes')
        } catch (error) {
            console.error('Error deleting mailbox:', error)
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatTimeRemaining = (expiresAt) => {
        const now = new Date()
        const expires = new Date(expiresAt)
        const diffMinutes = Math.floor((expires - now) / (1000 * 60))

        if (diffMinutes <= 0) return 'Expired'
        if (diffMinutes < 60) return `${diffMinutes} min`

        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
                    <p className="mt-4 text-muted">Loading mailbox...</p>
                </div>
            </div>
        )
    }

    if (!mailbox) {
        return (
            <div className="mx-auto max-w-7xl p-6 lg:p-8">
                <div className="rounded-2xl border border-border bg-surface p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised">
                        <AlertCircle className="h-8 w-8 text-muted" />
                    </div>
                    <h2 className="mb-2 text-2xl font-semibold text-foreground">Mailbox Not Found</h2>
                    <p className="mb-6 text-muted">The mailbox you're looking for doesn't exist.</p>
                    <Button onClick={() => router.push('/mailboxes')} className="rounded-xl px-5">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Mailboxes
                    </Button>
                </div>
            </div>
        )
    }

    const displayPersonalEmail =
        mailbox.personalEmail || mailbox.assignedPersonalEmails?.[0] || 'Not set'
    const aliases = mailbox.aliases || []
    const mailboxTags = mailbox.tags || []

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'settings', label: 'Settings' },
        { id: 'security', label: 'Security' },
        { id: 'sessions', label: `Sessions (${sessions.length})` },
    ]

    return (
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
            <div className="mb-8 space-y-4">
                <Link
                    href="/mailboxes"
                    className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
                >
                    <ArrowLeft size={16} />
                    Back to Mailboxes
                </Link>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <Mail size={24} className="text-primary" />
                            </div>
                            <div>
                                <h1 className="font-[var(--font-display)] text-3xl font-semibold break-all text-foreground lg:text-4xl">
                                    {mailbox.name}
                                </h1>
                                <p className="mt-1 text-sm text-muted">Created {formatDate(mailbox.createdAt)}</p>
                            </div>
                            <Badge
                                variant={mailbox.isActive ? 'default' : 'secondary'}
                                className={
                                    mailbox.isActive
                                        ? 'rounded-full border-transparent bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/10'
                                        : 'rounded-full border-transparent bg-muted/20 text-muted hover:bg-muted/20'
                                }
                            >
                                {mailbox.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="max-w-2xl text-sm text-muted">
                            {mailbox.description || 'Mailbox configuration, session control, and security actions live here.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={handleToggleStatus} className="rounded-xl px-4">
                            {mailbox.isActive ? (
                                <>
                                    <XCircle className="h-4 w-4" />
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Activate
                                </>
                            )}
                        </Button>
                        <Button onClick={() => router.push('/my-mailbox')} className="rounded-xl px-4">
                            <Mail className="h-4 w-4" />
                            Access Mailbox
                        </Button>
                    </div>
                </div>
            </div>

            {stats && (
                <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-border bg-surface p-5"
                    >
                        <p className="mb-3 text-sm text-muted">Total Emails</p>
                        <div className="flex items-center gap-2">
                            <Mail size={20} className="text-primary" />
                            <span className="text-2xl font-bold text-foreground">{stats.totalEmails}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted">
                            {stats.totalReceived || 0} received • {stats.totalSent || 0} sent
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-2xl border border-border bg-surface p-5"
                    >
                        <p className="mb-3 text-sm text-muted">Active Sessions</p>
                        <div className="flex items-center gap-2">
                            <Activity size={20} className="text-amber-500" />
                            <span className="text-2xl font-bold text-foreground">{sessions.length}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-border bg-surface p-5"
                    >
                        <p className="mb-3 text-sm text-muted">Active Aliases</p>
                        <div className="flex items-center gap-2">
                            <Shield size={20} className="text-violet-500" />
                            <span className="text-2xl font-bold text-foreground">{stats.activeAliases}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-2xl border border-border bg-surface p-5"
                    >
                        <p className="mb-3 text-sm text-muted">Storage Used</p>
                        <div className="flex items-center gap-2">
                            <Database size={20} className="text-emerald-500" />
                            <span className="text-2xl font-bold text-foreground">{stats.storageUsed}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted">
                            {stats.storageBytes?.toLocaleString() || 0} bytes
                        </p>
                    </motion.div>
                </div>
            )}

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface-raised p-1 md:grid-cols-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-surface text-foreground shadow-sm'
                                : 'text-muted hover:text-foreground'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <section className="rounded-2xl border border-border bg-surface p-6">
                            <div className="mb-6">
                                <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
                                    Mailbox Information
                                </h2>
                                <p className="mt-1 text-sm text-muted">Basic details about this mailbox</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <InfoField label="Mailbox Name" value={mailbox.name} />
                                <InfoField label="Sender Name" value={mailbox.senderName} />
                                <InfoField label="Personal Email" value={displayPersonalEmail} mono />
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted">Tags</p>
                                    <div className="flex min-h-12 flex-wrap gap-1.5 rounded-xl border border-border bg-surface-raised px-4 py-2.5">
                                        {mailboxTags.length > 0 ? (
                                            mailboxTags.map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs font-normal">
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted">No tags assigned</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted">Assigned Aliases</p>
                                    <div className="rounded-xl border border-border bg-surface-raised px-4 py-2.5">
                                        {aliases.length > 0 ? (
                                            <div className="space-y-1">
                                                {aliases.map((alias) => (
                                                    <p key={alias.id} className="break-all font-mono text-sm text-foreground">
                                                        {formatAlias(alias)}
                                                    </p>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted">No aliases assigned</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted">Status</p>
                                    <div className="rounded-xl border border-border bg-surface-raised px-4 py-2.5">
                                        <Badge
                                            variant={mailbox.isActive ? 'default' : 'secondary'}
                                            className={
                                                mailbox.isActive
                                                    ? 'rounded-full border-transparent bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/10'
                                                    : 'rounded-full border-transparent bg-muted/20 text-muted hover:bg-muted/20'
                                            }
                                        >
                                            {mailbox.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                                <InfoField label="Created" value={formatDate(mailbox.createdAt)} />
                            </div>
                        </section>

                        <section className="rounded-2xl border border-border bg-surface p-6">
                            <div className="mb-4">
                                <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
                                    Aliases Using This Mailbox
                                </h2>
                                <p className="mt-1 text-sm text-muted">Email aliases that forward to this mailbox</p>
                            </div>

                            {aliases.length > 0 ? (
                                <div className="space-y-3">
                                    {aliases.map((alias) => {
                                        const fullEmail = formatAlias(alias)
                                        return (
                                            <div
                                                key={alias.id}
                                                className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/30 md:flex-row md:items-center md:justify-between"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="break-all font-mono text-sm font-medium text-foreground">
                                                        {fullEmail}
                                                    </p>
                                                    <p className="text-sm text-muted">
                                                        Mode: {alias.mode === 'mailbox' ? 'Mailbox' : 'Forward'}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/aliases/${alias.domainId}/${alias.id}`)}
                                                    className="rounded-xl"
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised">
                                        <Mail className="h-8 w-8 text-muted" />
                                    </div>
                                    <p className="text-sm text-muted">No aliases using this mailbox yet</p>
                                </div>
                            )}
                        </section>
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <section className="rounded-2xl border border-border bg-surface p-6">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
                                        Mailbox Settings
                                    </h2>
                                    <p className="mt-1 text-sm text-muted">
                                        Update mailbox display information and sender identity
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveSettings} className="space-y-6">
                                <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
                                    <div>
                                        <p className="text-xs text-muted">Assigned Aliases</p>
                                        {aliases.length > 0 ? (
                                            <div className="mt-1 space-y-1">
                                                {aliases.map((alias) => (
                                                    <p key={alias.id} className="font-mono text-sm text-foreground">
                                                        {formatAlias(alias)}
                                                    </p>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="mt-1 text-sm text-muted">No aliases assigned</p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted">Tags</p>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {mailboxTags.length > 0 ? (
                                                mailboxTags.map((tag) => (
                                                    <Badge key={tag} variant="outline" className="text-xs font-normal">
                                                        {tag}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="mt-1 text-sm text-muted">No tags assigned</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <SettingField
                                        id="name"
                                        label="Mailbox Name"
                                        required
                                        value={settingsData.name}
                                        onChange={(value) => setSettingsData({ ...settingsData, name: value })}
                                        placeholder="e.g., Support Mailbox"
                                        hint="Unique name for this mailbox (max 100 characters)"
                                        disabled={isSavingSettings}
                                    />

                                    <SettingField
                                        id="senderName"
                                        label="Sender Name"
                                        required
                                        value={settingsData.senderName}
                                        onChange={(value) => setSettingsData({ ...settingsData, senderName: value })}
                                        placeholder="e.g., John Doe"
                                        hint="Used as sender name in outbound emails (max 100 characters)"
                                        disabled={isSavingSettings}
                                    />

                                    <SettingField
                                        id="personalEmail"
                                        label="Personal Email"
                                        required
                                        type="email"
                                        value={settingsData.personalEmail}
                                        onChange={(value) => setSettingsData({ ...settingsData, personalEmail: value })}
                                        placeholder="you@example.com"
                                        hint="Used to map mailbox access to your email identity"
                                        disabled={isSavingSettings}
                                    />

                                    <SettingField
                                        id="tagsInput"
                                        label="Tags"
                                        value={tagsInput}
                                        onChange={setTagsInput}
                                        placeholder="billing, primary, internal"
                                        hint="Comma-separated tags. These tags can only be changed by the mailbox creator."
                                        disabled={isSavingSettings}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground" htmlFor="description">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        id="description"
                                        className="min-h-24 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Add notes or description for this mailbox..."
                                        value={settingsData.description}
                                        onChange={(event) =>
                                            setSettingsData({ ...settingsData, description: event.target.value })
                                        }
                                        disabled={isSavingSettings}
                                        maxLength={500}
                                        rows={4}
                                    />
                                    <p className="text-xs text-muted">For your reference only (max 500 characters)</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                                    <Button type="submit" disabled={isSavingSettings} className="rounded-xl px-5">
                                        {isSavingSettings ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSettingsData({
                                                name: mailbox.name || '',
                                                senderName: mailbox.senderName || '',
                                                personalEmail:
                                                    mailbox.personalEmail || mailbox.assignedPersonalEmails?.[0] || '',
                                                tags: mailbox.tags || [],
                                                description: mailbox.description || '',
                                            })
                                            setTagsInput((mailbox.tags || []).join(', '))
                                        }}
                                        disabled={isSavingSettings}
                                        className="rounded-xl px-5"
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </section>

                        <section className="rounded-2xl border border-border bg-surface p-6">
                            <div className="mb-4">
                                <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
                                    How Sender Identity Works
                                </h2>
                            </div>
                            <div className="space-y-3 text-sm text-muted">
                                <InfoRow>
                                    <CheckCircle className="mt-0.5 h-4 w-4 text-[#22c55e]" />
                                    <p>
                                        <span className="font-medium text-foreground">Sender Name</span> is shown in recipient's inbox as the sender name
                                    </p>
                                </InfoRow>
                                <InfoRow>
                                    <CheckCircle className="mt-0.5 h-4 w-4 text-[#22c55e]" />
                                    <p>
                                        <span className="font-medium text-foreground">Mailbox Name</span> is used for identification in your UI
                                    </p>
                                </InfoRow>
                                <InfoRow>
                                    <CheckCircle className="mt-0.5 h-4 w-4 text-[#22c55e]" />
                                    <p>Email address remains the alias address (unchanged)</p>
                                </InfoRow>
                                <InfoRow>
                                    <CheckCircle className="mt-0.5 h-4 w-4 text-[#22c55e]" />
                                    <p>Changes apply immediately to new emails</p>
                                </InfoRow>
                            </div>
                        </section>
                    </motion.div>
                )}

                {activeTab === 'security' && (
                    <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <section className="rounded-2xl border border-border bg-surface p-6">
                            <div className="mb-6">
                                <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
                                    Password & Security
                                </h2>
                                <p className="mt-1 text-sm text-muted">
                                    Manage mailbox authentication and security settings
                                </p>
                            </div>

                            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                <div className="flex items-start gap-3">
                                    <Lock className="mt-0.5 h-4 w-4 text-primary" />
                                    <div>
                                        <h3 className="text-sm font-medium text-foreground">Mailbox Password</h3>
                                        <p className="mt-0.5 text-sm text-muted">
                                            This password is separate from your account password and is required to access this mailbox.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full rounded-xl"
                                onClick={() => setIsChangePasswordDialogOpen(true)}
                            >
                                <Key className="h-4 w-4" />
                                Change Password
                            </Button>
                        </section>

                        <section className="rounded-2xl border border-destructive/30 bg-surface p-6">
                            <div className="mb-4">
                                <h2 className="font-[var(--font-display)] text-xl font-semibold text-destructive">
                                    Danger Zone
                                </h2>
                                <p className="mt-1 text-sm text-muted">Irreversible and destructive actions</p>
                            </div>

                            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                                    <div>
                                        <h3 className="text-sm font-medium text-foreground">Delete Mailbox</h3>
                                        <p className="mt-0.5 text-sm text-destructive">
                                            This will permanently delete the mailbox and all associated emails. This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="destructive"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="rounded-xl"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Mailbox
                            </Button>
                        </section>
                    </motion.div>
                )}

                {activeTab === 'sessions' && (
                    <motion.div
                        key="sessions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <section className="rounded-2xl border border-border bg-surface p-6">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
                                        Active Sessions
                                    </h2>
                                    <p className="mt-1 text-sm text-muted">
                                        Currently authenticated sessions for this mailbox
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRefreshSessions}
                                    disabled={refreshingSessions}
                                    title="Refresh sessions"
                                >
                                    <RefreshCw className={`${refreshingSessions ? 'animate-spin' : ''} h-4 w-4`} />
                                </Button>
                            </div>

                            {sessions.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised">
                                        <Lock className="h-8 w-8 text-muted" />
                                    </div>
                                    <p className="text-foreground">No active sessions</p>
                                    <p className="mt-1 text-sm text-muted">
                                        Sessions appear here when someone logs into this mailbox
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <Activity className="h-4 w-4 shrink-0 text-[#22c55e]" />
                                                    <p className="text-sm font-medium text-foreground">Active Session</p>
                                                    <Badge variant="outline" className="text-xs">
                                                        {new Date(session.expiresAt) > new Date() ? 'Valid' : 'Expired'}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1 text-sm text-muted">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Created: {formatDate(session.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {new Date(session.expiresAt) > new Date()
                                                                ? `Expires in ${formatTimeRemaining(session.expiresAt)}`
                                                                : 'Expired'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRevokeSession(session.id)}
                                                className="shrink-0 rounded-xl"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Revoke
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-border bg-surface p-6">
                            <h2 className="mb-4 font-[var(--font-display)] text-xl font-semibold text-foreground">
                                Session Information
                            </h2>
                            <div className="space-y-3 text-sm text-muted">
                                <InfoRow>
                                    <CheckCircle className="mt-0.5 h-4 w-4 text-[#22c55e]" />
                                    <p>Sessions expire after 1 hour of inactivity</p>
                                </InfoRow>
                                <InfoRow>
                                    <CheckCircle className="mt-0.5 h-4 w-4 text-[#22c55e]" />
                                    <p>You can revoke sessions at any time</p>
                                </InfoRow>
                                <InfoRow>
                                    <CheckCircle className="mt-0.5 h-4 w-4 text-[#22c55e]" />
                                    <p>Changing the mailbox password invalidates all active sessions</p>
                                </InfoRow>
                            </div>
                        </section>
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-[var(--font-display)] text-foreground">
                            Change Mailbox Password
                        </DialogTitle>
                        <DialogDescription>
                            Update the password for this mailbox. All active sessions will be invalidated.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                        <SettingField
                            id="currentPassword"
                            label="Current Password"
                            type="password"
                            placeholder="Enter current password"
                            value={passwordData.currentPassword}
                            onChange={(value) =>
                                setPasswordData({ ...passwordData, currentPassword: value })
                            }
                            disabled={isSubmitting}
                            required
                        />

                        <SettingField
                            id="newPassword"
                            label="New Password"
                            type="password"
                            placeholder="Enter new password"
                            value={passwordData.newPassword}
                            onChange={(value) => setPasswordData({ ...passwordData, newPassword: value })}
                            disabled={isSubmitting}
                            required
                        >
                            <p className="text-xs text-muted">At least 8 characters</p>
                        </SettingField>

                        <SettingField
                            id="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordData.confirmPassword}
                            onChange={(value) =>
                                setPasswordData({ ...passwordData, confirmPassword: value })
                            }
                            disabled={isSubmitting}
                            required
                        />

                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Changing the password will log out all active sessions. You'll need to login again with the new password.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsChangePasswordDialogOpen(false)
                                    setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: '',
                                    })
                                }}
                                disabled={isSubmitting}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
                                {isSubmitting ? 'Changing...' : 'Change Password'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-[var(--font-display)] text-destructive">
                            Delete Mailbox
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the mailbox and all associated emails.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDeleteMailbox} className="mt-4 space-y-4">
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                                <div className="flex-1">
                                    <p className="mb-2 text-sm font-medium text-foreground">This will delete:</p>
                                    <ul className="list-inside list-disc space-y-1 text-sm text-destructive">
                                        <li>All emails in this mailbox</li>
                                        <li>All active sessions</li>
                                        <li>All aliases will be unlinked (not deleted)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <SettingField
                            id="deleteConfirmation"
                            label={
                                <>
                                    Type <span className="font-bold">{mailbox.name}</span> to confirm
                                </>
                            }
                            type="text"
                            placeholder={mailbox.name}
                            value={deleteConfirmation}
                            onChange={(value) => setDeleteConfirmation(value)}
                            disabled={isSubmitting}
                            required
                        />

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsDeleteDialogOpen(false)
                                    setDeleteConfirmation('')
                                }}
                                disabled={isSubmitting}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isSubmitting || deleteConfirmation !== mailbox.name}
                                className="rounded-xl"
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete Mailbox'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function InfoField({ label, value, mono = false }) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs text-muted">{label}</p>
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-2.5">
                <p className={`text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
        </div>
    )
}

function InfoRow({ children }) {
    return <div className="flex items-start gap-2">{children}</div>
}

function SettingField({
    id,
    label,
    value,
    onChange,
    placeholder,
    hint,
    required = false,
    type = 'text',
    disabled = false,
    children,
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor={id}>
                {label}
                {required ? <span className="text-destructive"> *</span> : null}
            </label>
            <Input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                required={required}
                className="h-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted focus-visible:border-primary/40"
            />
            {hint ? <p className="text-xs text-muted">{hint}</p> : null}
            {children}
        </div>
    )
}

export default SingleMailboxPage