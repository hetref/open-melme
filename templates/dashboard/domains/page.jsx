"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  X,
  ChevronRight,
  Clock
} from "lucide-react"
import Link from "next/link"

// Mock data for domains
const mockDomains = [
  {
    id: "1",
    domain: "aryanshinde.in",
    root: "aryanshinde.in",
    addedOn: "March 31, 2026",
    dkimStatus: "verified",
    mxStatus: "verified",
  },
  {
    id: "2", 
    domain: "example.com",
    root: "example.com",
    addedOn: "March 15, 2026",
    dkimStatus: "pending",
    mxStatus: "verified",
  },
]

type Domain = typeof mockDomains[0]

// Add Domain Modal Component
function AddDomainModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  const [rootDomain, setRootDomain] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    onClose()
    setRootDomain("")
    setSubdomain("")
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-surface border border-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-0">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
                    Add New Domain
                  </h2>
                  <p className="text-sm text-muted mt-1">
                    Configure your domain for email receiving. You can add a root domain or specify a subdomain explicitly.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-raised transition-colors text-muted hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Root Domain */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Root Domain <span className="text-muted">(Required)</span>
                  </label>
                  <input
                    type="text"
                    value={rootDomain}
                    onChange={(e) => setRootDomain(e.target.value)}
                    placeholder="mydomain.com or example.co.in"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted">
                    Your registrable domain without protocol or subdomain
                  </p>
                </div>

                {/* Subdomain */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Subdomain <span className="text-muted">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="mail or emails"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted">
                    Optional subdomain (no dots, alphanumeric + hyphens only)
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground-dim hover:bg-surface-raised transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!rootDomain || isLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Domain"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Domain Card Component
function DomainCard({ domain }: { domain: Domain }) {
  return (
    <Link href={`/domains/${domain.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Globe size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {domain.domain}
              </h3>
              <p className="text-sm text-muted mt-0.5">
                Root: {domain.root}
              </p>
              <p className="text-sm text-muted mt-1">
                Added on {domain.addedOn}
              </p>
              
              {/* Status Badges */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">DKIM:</span>
                  <span className={`text-xs font-medium ${
                    domain.dkimStatus === "verified" 
                      ? "text-[#22c55e]" 
                      : "text-amber-500"
                  }`}>
                    {domain.dkimStatus}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">MX:</span>
                  <span className={`text-xs font-medium ${
                    domain.mxStatus === "verified" 
                      ? "text-[#22c55e]" 
                      : "text-amber-500"
                  }`}>
                    {domain.mxStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Verified Badge */}
          <div className="flex items-center gap-2">
            {domain.dkimStatus === "verified" && domain.mxStatus === "verified" ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22c55e]/10 text-[#22c55e]">
                <CheckCircle2 size={14} />
                <span className="text-xs font-medium">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500">
                <Clock size={14} />
                <span className="text-xs font-medium">Pending</span>
              </div>
            )}
            <ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors" />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// Empty State Component
function EmptyState({ onAddDomain }: { onAddDomain: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border border-dashed rounded-2xl p-12 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Globe size={32} className="text-primary" />
      </div>
      <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground mb-2">
        No domains yet
      </h3>
      <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
        Add your first domain to start receiving emails with your custom email addresses.
      </p>
      <button
        onClick={onAddDomain}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground transition-colors"
      >
        <Plus size={18} />
        Add Your First Domain
      </button>
    </motion.div>
  )
}

export default function DomainsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [domains] = useState<Domain[]>(mockDomains)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl font-bold text-foreground">
              Domains
            </h1>
            <p className="text-muted mt-1">
              Manage your email domains and DNS records
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground transition-colors shadow-sm"
          >
            <Plus size={18} />
            Add New Domain
          </button>
        </div>

        {/* Domain List */}
        {domains.length > 0 ? (
          <div className="space-y-4">
            {domains.map((domain) => (
              <DomainCard key={domain.id} domain={domain} />
            ))}
          </div>
        ) : (
          <EmptyState onAddDomain={() => setIsModalOpen(true)} />
        )}
      </div>

      {/* Add Domain Modal */}
      <AddDomainModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}
