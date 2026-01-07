import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyDomainStatus } from '@/lib/ses'

/**
 * POST /api/domains/[domainId]/verify
 * Verify domain DNS and SES status
 */
export async function POST(request, { params }) {
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

    // Fetch domain from database
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

    // Verify domain status via AWS SES using fullDomain
    const verificationResult = await verifyDomainStatus(domain.fullDomain)

    // Update domain in database
    const updatedDomain = await prisma.domain.update({
      where: {
        id: domainId,
      },
      data: {
        verificationStatus: verificationResult.status,
        dkimStatus: verificationResult.dkimStatus,
        mxStatus: verificationResult.mxStatus,
        verificationError: verificationResult.verificationError,
      },
    })

    return NextResponse.json({
      status: updatedDomain.verificationStatus,
      dkimStatus: updatedDomain.dkimStatus,
      mxStatus: updatedDomain.mxStatus,
      missing: verificationResult.missing,
      details: verificationResult.details,
      verificationError: updatedDomain.verificationError,
    })
  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}
