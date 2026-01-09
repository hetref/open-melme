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
      include: {
        domain: {
          select: {
            id: true,
            fullDomain: true,
            verificationStatus: true,
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

    const { domainId, localPart, password, confirmPassword } = await req.json()

    // Validate inputs
    if (!domainId || !localPart || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    // Validate local part format
    const localPartRegex = /^[a-z0-9._-]+$/
    if (!localPartRegex.test(localPart)) {
      return NextResponse.json(
        { error: 'Invalid alias format. Use only lowercase letters, numbers, dots, hyphens, and underscores' },
        { status: 400 }
      )
    }

    // Verify domain belongs to user and is verified
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

    if (domain.verificationStatus !== 'verified') {
      return NextResponse.json(
        { error: 'Domain must be verified before creating a mailbox' },
        { status: 400 }
      )
    }

    const emailAlias = `${localPart}@${domain.fullDomain}`

    // Check if alias already exists
    const existingAlias = await prisma.alias.findUnique({
      where: {
        domainId_localPart: {
          domainId,
          localPart,
        },
      },
    })

    if (existingAlias) {
      return NextResponse.json(
        { error: 'This alias already exists. Delete the existing alias before creating a mailbox.' },
        { status: 409 }
      )
    }

    // Check if mailbox with same email already exists
    const existingMailbox = await prisma.mailbox.findUnique({
      where: {
        emailAlias,
      },
    })

    if (existingMailbox) {
      return NextResponse.json(
        { error: 'A mailbox with this email address already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create mailbox and alias in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create mailbox
      const mailbox = await tx.mailbox.create({
        data: {
          userId: session.user.id,
          domainId,
          emailAlias,
          passwordHash,
        },
        include: {
          domain: {
            select: {
              fullDomain: true,
            },
          },
        },
      })

      // Create alias with mailbox mode
      const alias = await tx.alias.create({
        data: {
          userId: session.user.id,
          domainId,
          localPart,
          mode: 'mailbox',
          mailboxId: mailbox.id,
        },
      })

      return { mailbox, alias }
    })

    return NextResponse.json(
      {
        message: 'Mailbox created successfully',
        mailbox: result.mailbox,
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
