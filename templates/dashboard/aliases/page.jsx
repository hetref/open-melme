"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, Mail, ArrowRight } from "lucide-react"

// Mock data for domains with aliases
const domainsWithAliases = [
  {
    id: "1",
    domain: "aryanshinde.in",
    verified: true,
    totalAliases: 10,
    activeAliases: 10,
  },
  {
    id: "2",
    domain: "example.com",
    verified: true,
    totalAliases: 5,
    activeAliases: 3,
  },
]

export default function AliasesPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[var(--font-display)] text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Email Aliases
        </h1>
        <p className="text-foreground-dim">
          Manage email aliases for your verified domains
        </p>
      </div>

      {/* Domains List */}
      <div className="space-y-4">
        {domainsWithAliases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Verified Domains</h3>
            <p className="text-foreground-dim mb-6 max-w-sm mx-auto">
              You need to add and verify a domain before creating email aliases.
            </p>
            <Link
              href="/domains"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Add Domain
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          domainsWithAliases.map((domain, index) => (
            <motion.div
              key={domain.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/aliases/${domain.id}`}
                className="block bg-surface border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-200 group"
              >
                {/* Domain Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {domain.domain}
                    </h3>
                    {domain.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#22c55e]">
                        <CheckCircle2 size={12} />
                        Verified
                      </span>
                    )}
                  </div>
                  <ArrowRight size={20} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                <p className="text-sm text-foreground-dim mb-4">
                  Click to manage aliases for this domain
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Aliases - Blue */}
                  <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#3b82f6] mb-1">
                      {domain.totalAliases}
                    </div>
                    <div className="text-sm text-[#3b82f6]/70">
                      Total Aliases
                    </div>
                  </div>

                  {/* Active Aliases - Green */}
                  <div className="bg-[#22c55e]/5 border border-[#22c55e]/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#22c55e] mb-1">
                      {domain.activeAliases}
                    </div>
                    <div className="text-sm text-[#22c55e]/70">
                      Active Aliases
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
