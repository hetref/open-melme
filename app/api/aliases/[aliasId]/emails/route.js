import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

/**
 * GET /api/aliases/[aliasId]/emails
 * Get paginated email list for an alias
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

    const { aliasId } = await params
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get('page') || '1', 10)
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    // Verify alias belongs to user
    const alias = await prisma.alias.findFirst({
      where: {
        id: aliasId,
        userId: session.user.id,
      },
      include: {
        domain: {
          select: {
            fullDomain: true,
          },
        },
      },
    })

    if (!alias) {
      return NextResponse.json(
        { error: 'Alias not found' },
        { status: 404 }
      )
    }

    // Get total count
    const totalCount = await prisma.emailLog.count({
      where: {
        aliasId,
      },
    })

    // Get paginated emails
    const emails = await prisma.emailLog.findMany({
      where: {
        aliasId,
      },
      select: {
        id: true,
        fromEmail: true,
        toEmail: true,
        subject: true,
        status: true,
        size: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      alias: {
        id: alias.id,
        localPart: alias.localPart,
        domain: alias.domain.fullDomain,
        fullEmail: `${alias.localPart}@${alias.domain.fullDomain}`,
      },
      emails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    )
  }
}
