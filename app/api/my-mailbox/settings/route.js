import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { validateMailboxSession } from '@/lib/mailbox'

// GET /api/my-mailbox/settings - Get current mailbox settings and stats
export async function GET(request) {
  try {
    // Verify user is authenticated
    const userSession = await auth.api.getSession({ headers: request.headers })

    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get mailbox session from cookie
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('melme_mailbox_session')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No mailbox session found' }, { status: 401 })
    }

    // Validate mailbox session
    const mailboxSession = await validateMailboxSession(sessionId, userSession.user.id)

    if (!mailboxSession) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    // Get full mailbox details with aliases
    const mailbox = await prisma.mailbox.findUnique({
      where: {
        id: mailboxSession.mailboxId,
      },
      include: {
        aliases: {
          where: {
            mode: 'mailbox',
            isActive: true,
          },
          include: {
            domain: {
              select: {
                fullDomain: true,
              },
            },
          },
        },
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    // Get all alias IDs for this mailbox
    const aliasIds = mailbox.aliases.map(a => a.id)

    // Count total emails received
    const receivedCount = await prisma.emailLog.count({
      where: {
        aliasId: {
          in: aliasIds,
        },
        status: 'received',
      },
    })

    // Count total emails sent (from this mailbox's aliases)
    const sentCount = await prisma.emailLog.count({
      where: {
        aliasId: {
          in: aliasIds,
        },
        status: 'sent',
      },
    })

    // Calculate storage used (sum of email sizes for both received and sent)
    const emailSizes = await prisma.emailLog.aggregate({
      where: {
        aliasId: {
          in: aliasIds,
        },
      },
      _sum: {
        size: true,
      },
    })

    const totalBytes = emailSizes._sum.size || 0

    // Format storage
    let storageUsed = '0 B'
    if (totalBytes > 0) {
      if (totalBytes < 1024) {
        storageUsed = `${totalBytes} B`
      } else if (totalBytes < 1024 * 1024) {
        storageUsed = `${(totalBytes / 1024).toFixed(1)} KB`
      } else if (totalBytes < 1024 * 1024 * 1024) {
        storageUsed = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
      } else {
        storageUsed = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      }
    }

    return NextResponse.json({
      mailbox: {
        id: mailbox.id,
        name: mailbox.name,
        slug: mailbox.slug,
        senderName: mailbox.senderName,
        description: mailbox.description,
        isActive: mailbox.isActive,
        createdAt: mailbox.createdAt,
      },
      aliases: mailbox.aliases.map(alias => ({
        id: alias.id,
        localPart: alias.localPart,
        fullEmail: `${alias.localPart}@${alias.domain.fullDomain}`,
        domainId: alias.domainId,
        isActive: alias.isActive,
      })),
      stats: {
        totalReceived: receivedCount,
        totalSent: sentCount,
        totalEmails: receivedCount + sentCount,
        activeAliases: mailbox.aliases.length,
        storageUsed,
        storageBytes: totalBytes,
      },
    })
  } catch (error) {
    console.error('Error fetching mailbox settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
