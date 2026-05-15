"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  HelpCircle,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

function CopyableField({ label, value, fullWidth = false, onCopy }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await onCopy(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`space-y-1.5 ${fullWidth ? "col-span-full" : ""}`}>
      <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
      <button
        onClick={handleCopy}
        className={`w-full group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
          copied
            ? "bg-[#22c55e]/10 border-[#22c55e]/30"
            : "bg-background border-border hover:border-primary/40 hover:bg-primary/5"
        }`}
      >
        <code className="text-sm text-foreground font-mono truncate flex-1">{value}</code>
        <div
          className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
            copied ? "bg-[#22c55e]/20" : ""
          }`}
        >
          {copied ? (
            <Check size={14} className="text-[#22c55e]" />
          ) : (
            <Copy size={14} className="text-muted group-hover:text-primary transition-colors" />
          )}
          <span
            className={`text-xs font-medium transition-colors ${
              copied ? "text-[#22c55e]" : "text-muted group-hover:text-primary"
            }`}
          >
            Copy
          </span>
        </div>
      </button>
    </div>
  )
}

const DomainDetailsPage = () => {
  const [domain, setDomain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const domainId = params.domainId

  useEffect(() => {
    if (domainId) {
      fetchDomain()
    }
  }, [domainId])

  const fetchDomain = async () => {
    try {
      const response = await fetch(`/api/domains/${domainId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch domain")
      }
      const data = await response.json()
      setDomain(data)
    } catch (error) {
      console.error("Error fetching domain:", error)
      toast.error("Failed to load domain details")
      router.push("/domains")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to verify domain")
      }

      const data = await response.json()

      if (data.status === "verified") {
        toast.success("Domain verified successfully!")
      } else if (data.missing && data.missing.length > 0) {
        toast.warning(
          `Verification pending: ${data.missing.join(", ")} records not detected`
        )
      } else {
        toast.info("Domain verification in progress")
      }

      await fetchDomain()
    } catch (error) {
      console.error("Error verifying domain:", error)
      toast.error("Failed to verify domain")
    } finally {
      setVerifying(false)
    }
  }

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const handleDeleteDomain = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/domains/${domainId}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete domain")
      }

      const data = await response.json()

      const statsMessage = data.stats
        ? ` (${data.stats.aliasesDeleted} aliases, ${data.stats.emailsDeleted} emails, ${data.stats.attachmentsDeleted} attachments deleted)`
        : ""

      toast.success(`Domain deleted successfully${statsMessage}`)

      if (data.warnings) {
        toast.warning(data.warnings.message, { duration: 5000 })
      }

      setIsDeleteDialogOpen(false)
      router.push("/domains")
    } catch (error) {
      console.error("Error deleting domain:", error)
      toast.error(error.message || "Failed to delete domain")
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto" />
          <p className="mt-4 text-foreground-dim">Loading domain details...</p>
        </div>
      </div>
    )
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Domain not found</h1>
          <Link href="/domains" className="text-primary hover:underline">
            Back to Domains
          </Link>
        </div>
      </div>
    )
  }

  const isFullyVerified =
    domain.dkimStatus === "verified" && domain.mxStatus === "verified"

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/domains"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Domains
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-[var(--font-display)] text-2xl font-bold text-foreground">
                {domain.fullDomain}
              </h1>
              <p className="text-sm text-muted mt-1">Root: {domain.rootDomain}</p>
              {domain.subdomain && (
                <p className="text-sm text-muted mt-1">Subdomain: {domain.subdomain}</p>
              )}
              <p className="text-sm text-muted mt-1">
                Added on{" "}
                {new Date(domain.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {isFullyVerified ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22c55e]/10 text-[#22c55e]">
                <CheckCircle2 size={14} />
                <span className="text-xs font-medium">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500">
                <AlertTriangle size={14} />
                <span className="text-xs font-medium">Pending Verification</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted mb-1">DKIM Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={18}
                  className={domain.dkimStatus === "verified" ? "text-[#22c55e]" : "text-amber-500"}
                />
                <span
                  className={`text-sm font-medium ${
                    domain.dkimStatus === "verified" ? "text-[#22c55e]" : "text-amber-500"
                  }`}
                >
                  {domain.dkimStatus === "verified" ? "Verified" : "Pending"}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">Required for domain ownership</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">MX Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={18}
                  className={domain.mxStatus === "verified" ? "text-[#22c55e]" : "text-amber-500"}
                />
                <span
                  className={`text-sm font-medium ${
                    domain.mxStatus === "verified" ? "text-[#22c55e]" : "text-amber-500"
                  }`}
                >
                  {domain.mxStatus === "verified" ? "Verified" : "Pending"}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">Required for email receiving</p>
            </div>
          </div>

          {domain.verificationError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive">{domain.verificationError}</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-2xl p-6 mb-6"
        >
          <div className="mb-8">
            <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
              DNS Configuration
            </h2>
            <p className="text-sm text-muted mt-2">
              Add these DNS records to your DNS provider for{" "}
              <span className="font-medium text-primary">{domain.rootDomain}</span>. Changes may take up to 48 hours to propagate.
            </p>
          </div>

          {domain.dnsRecords?.mx && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    domain.dkimStatus === "verified" ? "bg-[#22c55e]/10" : "bg-amber-500/10"
                  }`}
                >
                  <CheckCircle2
                    size={18}
                    className={domain.dkimStatus === "verified" ? "text-[#22c55e]" : "text-amber-500"}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">MX Record</h3>
                  <p className="text-xs text-muted">Required for receiving emails</p>
                </div>
              </div>

              <div className="bg-surface-raised/50 rounded-xl p-5 border border-border/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CopyableField label="Type" value={domain.dnsRecords.mx.type} onCopy={copyToClipboard} />
                  <CopyableField label="Host / Name" value={domain.dnsRecords.mx.host} onCopy={copyToClipboard} />
                  <CopyableField label="Priority" value={domain.dnsRecords.mx.priority} onCopy={copyToClipboard} />
                  <CopyableField label="Value" value={domain.dnsRecords.mx.value} onCopy={copyToClipboard} />
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-border my-6" />

          {domain.dnsRecords?.dkim?.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    domain.dkimStatus === "verified" ? "bg-[#22c55e]/10" : "bg-amber-500/10"
                  }`}
                >
                  <CheckCircle2
                    size={18}
                    className={domain.dkimStatus === "verified" ? "text-[#22c55e]" : "text-amber-500"}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">DKIM Records</h3>
                  <p className="text-xs text-muted">Required for domain ownership verification</p>
                </div>
              </div>

              <div className="space-y-4">
                {domain.dnsRecords.dkim.map((record, index) => (
                  <div
                    key={record.id || index}
                    className="bg-surface-raised/50 rounded-xl p-5 border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground-dim">
                        DKIM Record {index + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <CopyableField label="Type" value={record.type} onCopy={copyToClipboard} />
                      <CopyableField label="Host / Name" value={record.host} onCopy={copyToClipboard} />
                      <CopyableField label="Value" value={record.value} onCopy={copyToClipboard} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={verifying ? "animate-spin" : ""} />
                {verifying ? "Verifying DNS Records..." : "Verify DNS Records"}
              </button>
              <p className="text-sm text-muted">
                Click to check if your DNS records have been configured correctly
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-2xl p-6 mb-6"
        >
          <h2 className="font-[var(--font-display)] text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <HelpCircle size={20} className="text-muted" />
            Need Help?
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">What is DKIM?</h3>
              <p className="text-sm text-muted">
                DKIM (DomainKeys Identified Mail) is a cryptographic signature that proves you own the domain. It prevents email spoofing and ensures your emails are trusted by recipients. <span className="font-medium text-foreground">Both DKIM and MX records must be verified before you can send or receive emails.</span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">DNS Propagation</h3>
              <p className="text-sm text-muted">
                DNS changes can take up to 48 hours to propagate globally. If verification fails, please wait a bit and try again.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">Common DNS Providers</h3>
              <p className="text-sm text-muted">
                For help adding DNS records, check your provider's documentation: Cloudflare, GoDaddy, Namecheap, Google Domains, etc.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface border border-destructive/30 rounded-2xl p-6"
        >
          <h2 className="font-[var(--font-display)] text-lg font-semibold text-destructive mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-muted mb-4">
            Permanently delete this domain and remove it from AWS SES
          </p>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Delete Domain</h3>
              <p className="text-xs text-muted mt-0.5">
                Once you delete this domain, it will be removed from AWS SES and all associated aliases and email logs will be permanently deleted.
              </p>
            </div>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-destructive hover:bg-destructive/90 text-white transition-colors flex-shrink-0 ml-4"
            >
              <Trash2 size={16} />
              Delete Domain
            </button>
          </div>
        </motion.div>

        {isDeleteDialogOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsDeleteDialogOpen(false)}
            />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-xl">
              <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground mb-2">
                Delete Domain
              </h3>
              <p className="text-sm text-muted mb-6">
                Are you sure you want to delete <span className="font-medium text-foreground">{domain.fullDomain}</span>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-foreground-dim hover:bg-surface-raised transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDomain}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-destructive hover:bg-destructive/90 text-white transition-colors"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Domain
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DomainDetailsPage
