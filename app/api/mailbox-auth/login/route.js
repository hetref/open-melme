import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, createMailboxSession } from '@/lib/mailbox'
import { cookies } from 'next/headers'

function parseAliasEmail(aliasEmail) {
  if (typeof aliasEmail !== 'string') {
    return null
  }

  const normalized = aliasEmail.trim().toLowerCase()
  const atIndex = normalized.lastIndexOf('@')

  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return null
  }

  return {
    localPart: normalized.slice(0, atIndex),
    domain: normalized.slice(atIndex + 1),
  }
}

export async function POST(req) {
  try {
    const { aliasEmail, password } = await req.json()

    if (!aliasEmail || !password) {
      return NextResponse.json(
        { error: 'Alias email and password are required' },
        { status: 400 }
      )
    }

    const parsedAliasEmail = parseAliasEmail(aliasEmail)

    if (!parsedAliasEmail) {
      return NextResponse.json(
        { error: 'Alias email is invalid' },
        { status: 400 }
      )
    }

    // Resolve the alias and its assigned mailbox.
    const alias = await prisma.alias.findFirst({
      where: {
        localPart: parsedAliasEmail.localPart,
        mode: 'mailbox',
        isActive: true,
        mailboxId: {
          not: null,
        },
        domain: {
          fullDomain: {
            equals: parsedAliasEmail.domain,
            mode: 'insensitive',
          },
        },
      },
      select: {
        id: true,
        localPart: true,
        mailboxId: true,
        domain: {
          select: {
            fullDomain: true,
          },
        },
      },
    })

    if (!alias?.mailboxId) {
      return NextResponse.json(
        { error: 'Alias not found or not assigned to an active mailbox' },
        { status: 404 }
      )
    }

    // Find mailbox by alias assignment.
    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: alias.mailboxId,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        senderName: true,
        personalEmail: true,
        tags: true,
        description: true,
        isActive: true,
        passwordHash: true,
        aliases: {
          select: {
            id: true,
            localPart: true,
            personalEmail: true,
            domain: {
              select: {
                fullDomain: true,
              },
            },
          },
          where: {
            mode: 'mailbox',
          },
        },
      },
    })

    if (!mailbox) {
      return NextResponse.json(
        { error: 'Mailbox not found' },
        { status: 404 }
      )
    }

    if (!mailbox.isActive) {
      return NextResponse.json(
        { error: 'This mailbox is disabled' },
        { status: 403 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, mailbox.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Get user agent and IP
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown'

    // Create session
    const mailboxSession = await createMailboxSession(
      mailbox.id,
      mailbox.userId,
      userAgent,
      ipAddress
    )

    const assignedPersonalEmails = [...new Set(
      mailbox.aliases
        .map((alias) => alias.personalEmail)
        .filter(Boolean)
    )]
    const resolvedPersonalEmail = mailbox.personalEmail || assignedPersonalEmails[0] || null

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('melme_mailbox_session', mailboxSession.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    return NextResponse.json({
      message: 'Login successful',
      mailbox: {
        id: mailbox.id,
        name: mailbox.name,
        senderName: mailbox.senderName,
        personalEmail: resolvedPersonalEmail,
        assignedPersonalEmails,
        tags: mailbox.tags,
        description: mailbox.description,
        aliases: mailbox.aliases.map((mailboxAlias) => ({
          ...mailboxAlias,
          email: `${mailboxAlias.localPart}@${mailboxAlias.domain?.fullDomain || 'unknown'}`,
        })),
      },
      expiresAt: mailboxSession.expiresAt,
    })
  } catch (error) {
    console.error('Error logging into mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to login to mailbox' },
      { status: 500 }
    )
  }
}
