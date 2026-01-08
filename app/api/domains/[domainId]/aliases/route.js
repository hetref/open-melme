import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

/**
 * GET /api/domains/[domainId]/aliases
 * Get all aliases for a specific domain
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

    // Verify domain belongs to user
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

    // Get aliases with email log counts
    const aliases = await prisma.alias.findMany({
      where: {
        domainId,
      },
      include: {
        _count: {
          select: {
            logs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const aliasesWithCounts = aliases.map((alias) => ({
      id: alias.id,
      localPart: alias.localPart,
      forwardTo: alias.forwardTo,
      isActive: alias.isActive,
      emailCount: alias._count.logs,
      createdAt: alias.createdAt,
      updatedAt: alias.updatedAt,
    }))

    return NextResponse.json({
      domain: {
        id: domain.id,
        fullDomain: domain.fullDomain,
        rootDomain: domain.rootDomain,
        subdomain: domain.subdomain,
      },
      aliases: aliasesWithCounts,
    })
  } catch (error) {
    console.error('Error fetching domain aliases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch aliases' },
      { status: 500 }
    )
  }
}
