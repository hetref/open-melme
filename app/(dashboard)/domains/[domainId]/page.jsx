"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Copy, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
        throw new Error('Failed to fetch domain')
      }
      const data = await response.json()
      setDomain(data)
    } catch (error) {
      console.error('Error fetching domain:', error)
      toast.error('Failed to load domain details')
      router.push('/domains')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to verify domain')
      }

      const data = await response.json()

      if (data.status === 'verified') {
        toast.success('Domain verified successfully!')
      } else if (data.missing && data.missing.length > 0) {
        toast.warning(`Verification pending: ${data.missing.join(', ')} records not detected`)
      } else {
        toast.info('Domain verification in progress')
      }

      // Refresh domain data
      await fetchDomain()
    } catch (error) {
      console.error('Error verifying domain:', error)
      toast.error('Failed to verify domain')
    } finally {
      setVerifying(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleDeleteDomain = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/domains/${domainId}/delete`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete domain')
      }

      const data = await response.json()

      // Show success with stats
      const statsMessage = data.stats
        ? ` (${data.stats.aliasesDeleted} aliases, ${data.stats.emailsDeleted} emails, ${data.stats.attachmentsDeleted} attachments deleted)`
        : ''

      toast.success(`Domain deleted successfully${statsMessage}`)

      if (data.warnings) {
        toast.warning(data.warnings.message, { duration: 5000 })
      }

      setIsDeleteDialogOpen(false)

      // Redirect to domains list
      router.push('/domains')
    } catch (error) {
      console.error('Error deleting domain:', error)
      toast.error(error.message || 'Failed to delete domain')
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Verified
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-4 h-4 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getRecordStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading domain details...</p>
        </div>
      </div>
    )
  }

  if (!domain) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6 -ml-2"
        onClick={() => router.push('/domains')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Domains
      </Button>

      <div className="space-y-6">
        {/* Domain Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{domain.fullDomain}</CardTitle>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="text-sm">
                    Root: {domain.rootDomain}
                  </Badge>
                  {domain.subdomain && (
                    <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700">
                      Subdomain: {domain.subdomain}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Added on {new Date(domain.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </CardDescription>
              </div>
              {getStatusBadge(domain.verificationStatus)}
            </div>
            {domain.verificationStatus !== 'verified' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 mb-1">
                      Domain verification required
                    </p>
                    <p className="text-sm text-yellow-800">
                      Both DKIM and MX records must be verified to send and receive emails. DKIM verification proves domain ownership and prevents spoofing.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">DKIM Status</p>
                <div className="flex items-center gap-2">
                  {getRecordStatusIcon(domain.dkimStatus)}
                  <span className="font-medium capitalize">{domain.dkimStatus || 'pending'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Required for domain ownership</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">MX Status</p>
                <div className="flex items-center gap-2">
                  {getRecordStatusIcon(domain.mxStatus)}
                  <span className="font-medium capitalize">{domain.mxStatus || 'pending'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Required for email receiving</p>
              </div>
            </div>
            {domain.verificationError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{domain.verificationError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DNS Records Section */}
        <Card>
          <CardHeader>
            <CardTitle>DNS Configuration</CardTitle>
            <CardDescription>
              Add these DNS records to your DNS provider for <strong>{domain.rootDomain}</strong>. Changes may take up to 48 hours to propagate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {domain.dnsRecords && (
              <>
                {/* MX Record */}
                {domain.dnsRecords.mx && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">MX Record (Required for Email Receiving)</h3>
                        {domain.subdomain && (
                          <p className="text-sm text-gray-600 mt-1">
                            Configure this on your root domain's DNS ({domain.rootDomain})
                          </p>
                        )}
                      </div>
                      {getRecordStatusIcon(domain.mxStatus)}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium mb-1">Type</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-white px-2 py-1 rounded border">
                            {domain.dnsRecords.mx.type}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(domain.dnsRecords.mx.type)}
                            className="h-7 w-7 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium mb-1">Host/Name</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-white px-2 py-1 rounded border">
                            {domain.dnsRecords.mx.host}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(domain.dnsRecords.mx.host)}
                            className="h-7 w-7 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 font-medium mb-1">Value</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-white px-2 py-1 rounded border flex-1 overflow-x-auto text-xs">
                            {domain.dnsRecords.mx.value}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(domain.dnsRecords.mx.value)}
                            className="h-7 w-7 p-0 shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <p className="text-gray-600 font-medium mb-1">Priority</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-white px-2 py-1 rounded border">
                            {domain.dnsRecords.mx.priority}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(String(domain.dnsRecords.mx.priority))}
                            className="h-7 w-7 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DKIM Records */}
                {domain.dnsRecords.dkim && domain.dnsRecords.dkim.length > 0 && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">DKIM Records (Required for Domain Ownership)</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          DKIM cryptographically proves you own this domain and prevents email spoofing
                        </p>
                        {domain.subdomain && (
                          <p className="text-sm text-gray-600 mt-1">
                            These are CNAME records for the full domain: {domain.fullDomain}
                          </p>
                        )}
                      </div>
                      {getRecordStatusIcon(domain.dkimStatus)}
                    </div>
                    <div className="space-y-4">
                      {domain.dnsRecords.dkim.map((record, index) => (
                        <div key={index} className="border-t pt-4 first:border-t-0 first:pt-0">
                          <p className="text-sm font-medium text-gray-700 mb-2">DKIM Record {index + 1}</p>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 font-medium mb-1">Type</p>
                              <div className="flex items-center gap-2">
                                <code className="bg-white px-2 py-1 rounded border">
                                  {record.type}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(record.type)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="col-span-3">
                              <p className="text-gray-600 font-medium mb-1">Host/Name</p>
                              <div className="flex items-center gap-2">
                                <code className="bg-white px-2 py-1 rounded border flex-1 overflow-x-auto text-xs">
                                  {record.host}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(record.host)}
                                  className="h-7 w-7 p-0 shrink-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="col-span-4">
                              <p className="text-gray-600 font-medium mb-1">Value</p>
                              <div className="flex items-center gap-2">
                                <code className="bg-white px-2 py-1 rounded border flex-1 overflow-x-auto text-xs break-all">
                                  {record.value}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(record.value)}
                                  className="h-7 w-7 p-0 shrink-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Verify Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full sm:w-auto gap-2"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Verify DNS Records
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Click to check if your DNS records have been configured correctly
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What is DKIM?</h4>
              <p className="text-sm text-gray-600">
                DKIM (DomainKeys Identified Mail) is a cryptographic signature that proves you own the domain.
                It prevents email spoofing and ensures your emails are trusted by recipients.
                <strong> Both DKIM and MX records must be verified before you can send or receive emails.</strong>
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">DNS Propagation</h4>
              <p className="text-sm text-gray-600">
                DNS changes can take up to 48 hours to propagate globally. If verification fails, please wait a bit and try again.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Common DNS Providers</h4>
              <p className="text-sm text-gray-600">
                For help adding DNS records, check your provider's documentation: Cloudflare, GoDaddy, Namecheap, Google Domains, etc.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this domain and remove it from AWS SES
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium mb-1">Delete Domain</h4>
                <p className="text-sm text-gray-600">
                  Once you delete this domain, it will be removed from AWS SES and all associated aliases and email logs will be permanently deleted.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="gap-2 ml-4"
              >
                <Trash2 className="w-4 h-4" />
                Delete Domain
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Domain</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this domain? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-900 mb-2">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                <li>Domain: <strong>{domain.fullDomain}</strong></li>
                <li>AWS SES identity and all DNS configurations</li>
                <li>All email aliases associated with this domain</li>
                <li>All emails received/sent by those aliases</li>
                <li>All email attachments stored in S3</li>
              </ul>
              <p className="text-sm text-red-900 mt-3 font-medium">
                ⚠️ This action is permanent and cannot be undone. The deletion may take a few seconds
                for large datasets as all S3 objects are removed in batches.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDomain}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DomainDetailsPage
