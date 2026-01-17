import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verifyPassword, createMailboxSession } from '@/lib/mailbox'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId, password } = await req.json()

    if (!mailboxId || !password) {
      return NextResponse.json(
        { error: 'Mailbox ID and password are required' },
        { status: 400 }
      )
    }

    // Find mailbox
    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: mailboxId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        senderName: true,
        description: true,
        isActive: true,
        passwordHash: true,
        aliases: {
          select: {
            id: true,
            localPart: true,
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
      session.user.id,
      userAgent,
      ipAddress
    )

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
        slug: mailbox.slug,
        senderName: mailbox.senderName,
        description: mailbox.description,
        aliases: mailbox.aliases,
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
