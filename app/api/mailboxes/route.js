import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/mailboxes - List all mailboxes for the authenticated user
export async function GET(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mailboxes = await prisma.mailbox.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        senderName: true,
        personalEmail: true,
        tags: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        aliases: {
          select: {
            id: true,
            localPart: true,
            personalEmail: true,
            isActive: true,
            domain: {
              select: {
                fullDomain: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessions: {
              where: {
                revokedAt: null,
                expiresAt: {
                  gt: new Date(),
                },
              },
            },
            aliases: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ mailboxes })
  } catch (error) {
    console.error('Error fetching mailboxes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mailboxes' },
      { status: 500 }
    )
  }
}

// POST /api/mailboxes - Create a new mailbox
export async function POST(req) {
  const session = await auth.api.getSession({ headers: req.headers })

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      error:
        'Direct mailbox creation is disabled. Create a mailbox while creating an alias so every mailbox has at least one alias.',
    },
    { status: 405 }
  )
}
