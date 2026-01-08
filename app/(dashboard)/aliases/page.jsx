"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Mail } from 'lucide-react'
import { toast } from 'sonner'

const AliasesPage = () => {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/aliases')
      if (!response.ok) {
        throw new Error('Failed to fetch domains')
      }
      const data = await response.json()
      setDomains(data.domains)
    } catch (error) {
      console.error('Error fetching domains:', error)
      toast.error('Failed to load domains')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'verified') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading domains...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Aliases</h1>
        <p className="text-gray-600 mt-2">Manage email aliases for your verified domains</p>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No domains yet</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Add and verify a domain first to start creating email aliases
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => (
            <Card
              key={domain.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/aliases/${domain.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{domain.fullDomain}</CardTitle>
                      {getStatusBadge(domain.verificationStatus)}
                    </div>
                    <CardDescription>
                      Click to manage aliases for this domain
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">
                      {domain.totalAliases}
                    </div>
                    <div className="text-sm text-blue-700">Total Aliases</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">
                      {domain.activeAliases}
                    </div>
                    <div className="text-sm text-green-700">Active Aliases</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AliasesPage
