import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyDomainConnection } from '@/lib/ses'

/**
 * GET /api/aliases
 * Get all domains with alias counts for the logged-in user
 */
export async function GET() {
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

    const domains = await prisma.domain.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        aliases: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const domainsWithCounts = domains.map((domain) => ({
      id: domain.id,
      fullDomain: domain.fullDomain,
      rootDomain: domain.rootDomain,
      subdomain: domain.subdomain,
      verificationStatus: domain.verificationStatus,
      totalAliases: domain.aliases.length,
      activeAliases: domain.aliases.filter((a) => a.isActive).length,
      createdAt: domain.createdAt,
    }))

    return NextResponse.json({ domains: domainsWithCounts })
  } catch (error) {
    console.error('Error fetching aliases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch aliases' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/aliases
 * Create a new alias
 */
export async function POST(request) {
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

    const body = await request.json()
    const { domainId, localPart, forwardTo } = body

    if (!domainId || !localPart || !forwardTo) {
      return NextResponse.json(
        { error: 'domainId, localPart, and forwardTo are required' },
        { status: 400 }
      )
    }

    // Validate localPart format
    const cleanLocalPart = localPart.toLowerCase().trim()
    const localPartRegex = /^[a-z0-9-]+$/

    if (!localPartRegex.test(cleanLocalPart)) {
      return NextResponse.json(
        { error: 'Local part must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Validate forwardTo email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forwardTo)) {
      return NextResponse.json(
        { error: 'Invalid forward to email address' },
        { status: 400 }
      )
    }

    // Check if domain belongs to user
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

    // Verify domain connection status before creating alias
    console.log('Checking domain connection status for:', domain.fullDomain);
    const connectionStatus = await verifyDomainConnection(domain.fullDomain);

    // Update domain status in database
    await prisma.domain.update({
      where: { id: domain.id },
      data: {
        verificationStatus: connectionStatus.verificationStatus,
        dkimStatus: connectionStatus.dkimStatus,
        lastCheckedAt: new Date(),
      },
    });

    // Reject alias creation if domain is not connected
    if (!connectionStatus.isConnected) {
      return NextResponse.json(
        {
          error: 'Domain is not connected or verified. Please verify your DNS records before creating aliases.',
          details: connectionStatus.error || 'Domain verification failed',
        },
        { status: 400 }
      )
    }

    // Check if alias already exists
    const existingAlias = await prisma.alias.findUnique({
      where: {
        domainId_localPart: {
          domainId,
          localPart: cleanLocalPart,
        },
      },
    })

    if (existingAlias) {
      return NextResponse.json(
        { error: 'Alias already exists for this domain' },
        { status: 400 }
      )
    }

    // Create alias
    const alias = await prisma.alias.create({
      data: {
        userId: session.user.id,
        domainId,
        localPart: cleanLocalPart,
        forwardTo: forwardTo.toLowerCase().trim(),
        isActive: true,
      },
    })

    return NextResponse.json(
      {
        alias: {
          id: alias.id,
          localPart: alias.localPart,
          forwardTo: alias.forwardTo,
          isActive: alias.isActive,
          createdAt: alias.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating alias:', error)
    return NextResponse.json(
      { error: 'Failed to create alias' },
      { status: 500 }
    )
  }
}
