"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'

const DomainsPage = () => {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [rootDomain, setRootDomain] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains')
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

  const handleAddDomain = async (e) => {
    e.preventDefault()

    if (!rootDomain.trim()) {
      toast.error('Please enter a root domain')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rootDomain: rootDomain.trim(),
          subdomain: subdomain.trim() || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add domain')
      }

      toast.success('Domain added successfully!')
      setIsAddDialogOpen(false)
      setRootDomain('')
      setSubdomain('')

      // Redirect to domain details page
      router.push(`/domains/${data.domainId}`)
    } catch (error) {
      console.error('Error adding domain:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading domains...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Domains</h1>
          <p className="text-gray-600 mt-2">Manage your email domains and DNS records</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add New Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Domain</DialogTitle>
              <DialogDescription>
                Configure your domain for email receiving. You can add a root domain or specify a subdomain explicitly.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDomain} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="rootDomain">Root Domain (Required)</Label>
                <Input
                  id="rootDomain"
                  type="text"
                  placeholder="mydomain.com or example.co.in"
                  value={rootDomain}
                  onChange={(e) => setRootDomain(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                <p className="text-sm text-gray-500">
                  Your registrable domain without protocol or subdomain
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain (Optional)</Label>
                <Input
                  id="subdomain"
                  type="text"
                  placeholder="mail or emails"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                <p className="text-sm text-gray-500">
                  Optional subdomain (no dots, alphanumeric + hyphens only)
                </p>
              </div>
              {(rootDomain || subdomain) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-900">Preview:</p>
                  <p className="text-sm text-blue-700 font-mono mt-1">
                    {subdomain ? `${subdomain}.${rootDomain || '___'}` : rootDomain || '___'}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setRootDomain('')
                    setSubdomain('')
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Domain'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No domains yet</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Add your first domain to start receiving and forwarding emails
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => (
            <Card
              key={domain.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/domains/${domain.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{domain.fullDomain}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Root: {domain.rootDomain}
                      </Badge>
                      {domain.subdomain && (
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          Subdomain: {domain.subdomain}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Added on {new Date(domain.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(domain.verificationStatus)}
                    {domain.verificationStatus === 'pending' && (
                      <p className="text-xs text-gray-500 text-right">
                        DNS setup required
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">DKIM:</span>{' '}
                    <span className={`font-medium ${domain.dkimStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                      {domain.dkimStatus || 'pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">MX:</span>{' '}
                    <span className={`font-medium ${domain.mxStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                      {domain.mxStatus || 'pending'}
                    </span>
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

export default DomainsPage
