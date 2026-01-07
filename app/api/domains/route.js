import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { createEmailIdentity, isValidDomain, isValidSubdomain, constructFullDomain } from '@/lib/ses'

/**
 * GET /api/domains
 * Fetch all domains for the logged-in user
 */
export async function GET(request) {
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
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        rootDomain: true,
        subdomain: true,
        fullDomain: true,
        verificationStatus: true,
        dkimStatus: true,
        mxStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/domains
 * Create a new domain
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
    const { rootDomain, subdomain } = body

    // Validate rootDomain
    if (!rootDomain || typeof rootDomain !== 'string') {
      return NextResponse.json(
        { error: 'Root domain is required' },
        { status: 400 }
      )
    }

    const cleanRootDomain = rootDomain.toLowerCase().trim()

    if (!isValidDomain(cleanRootDomain)) {
      return NextResponse.json(
        { error: 'Invalid root domain format' },
        { status: 400 }
      )
    }

    // Validate subdomain (if provided)
    const cleanSubdomain = subdomain ? subdomain.toLowerCase().trim() : null

    if (cleanSubdomain && !isValidSubdomain(cleanSubdomain)) {
      return NextResponse.json(
        { error: 'Invalid subdomain format. Use only lowercase alphanumeric characters and hyphens, no dots.' },
        { status: 400 }
      )
    }

    // Construct full domain
    const fullDomain = constructFullDomain(cleanRootDomain, cleanSubdomain)

    // Check if domain already exists for this user
    const existingDomain = await prisma.domain.findUnique({
      where: {
        userId_fullDomain: {
          userId: session.user.id,
          fullDomain: fullDomain,
        },
      },
    })

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already added' },
        { status: 400 }
      )
    }

    // Create email identity in AWS SES
    let sesData
    try {
      sesData = await createEmailIdentity(fullDomain, cleanRootDomain, cleanSubdomain)
    } catch (sesError) {
      console.error('SES error:', sesError)
      return NextResponse.json(
        { error: `AWS SES error: ${sesError.message}` },
        { status: 500 }
      )
    }

    // Store domain in database
    const newDomain = await prisma.domain.create({
      data: {
        userId: session.user.id,
        rootDomain: cleanRootDomain,
        subdomain: cleanSubdomain,
        fullDomain: fullDomain,
        sesIdentityArn: sesData.identityArn,
        verificationStatus: 'pending',
        dkimStatus: 'pending',
        mxStatus: 'pending',
        dnsRecords: JSON.stringify(sesData.dnsRecords),
      },
    })

    return NextResponse.json({
      domainId: newDomain.id,
      rootDomain: newDomain.rootDomain,
      subdomain: newDomain.subdomain,
      fullDomain: newDomain.fullDomain,
      dnsRecords: sesData.dnsRecords,
      verificationStatus: newDomain.verificationStatus,
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating domain:', error)
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    )
  }
}
