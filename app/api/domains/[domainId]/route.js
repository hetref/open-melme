import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

/**
 * GET /api/domains/[domainId]
 * Fetch single domain with DNS records
 */
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { domainId } = await params

    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        userId: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Parse DNS records
    let dnsRecords = null
    if (domain.dnsRecords) {
      try {
        dnsRecords = JSON.parse(domain.dnsRecords)
      } catch (e) {
        console.error('Error parsing DNS records:', e)
      }
    }

    return NextResponse.json({
      id: domain.id,
      rootDomain: domain.rootDomain,
      subdomain: domain.subdomain,
      fullDomain: domain.fullDomain,
      verificationStatus: domain.verificationStatus,
      dkimStatus: domain.dkimStatus,
      mxStatus: domain.mxStatus,
      verificationError: domain.verificationError,
      dnsRecords,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching domain:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    )
  }
}
