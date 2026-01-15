import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/mailbox'

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
        slug: true,
        senderName: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        domainId: true,
        domain: {
          select: {
            id: true,
            fullDomain: true,
            verificationStatus: true,
          },
        },
        aliases: {
          select: {
            id: true,
            localPart: true,
            isActive: true,
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
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, slug, senderName, description, password, confirmPassword } = await req.json()

    // Validate inputs
    if (!name || !slug || !senderName || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Name, slug, sender name, and password are required' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Validate slug format (URL-safe)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingMailbox = await prisma.mailbox.findUnique({
      where: {
        slug,
      },
    })

    if (existingMailbox) {
      return NextResponse.json(
        { error: 'A mailbox with this slug already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create mailbox independently (no alias dependency)
    const mailbox = await prisma.mailbox.create({
      data: {
        userId: session.user.id,
        name,
        slug,
        senderName,
        description: description || null,
        passwordHash,
        domainId: null, // No domain required at creation
      },
    })

    return NextResponse.json(
      {
        message: 'Mailbox created successfully. You can now assign aliases to this mailbox.',
        mailbox,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to create mailbox' },
      { status: 500 }
    )
  }
}
