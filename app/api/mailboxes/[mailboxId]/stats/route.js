import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/mailboxes/[mailboxId]/stats - Get mailbox statistics
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId } = await params

    // Verify mailbox ownership
    const mailbox = await prisma.mailbox.findUnique({
      where: {
        id: mailboxId,
        userId: session.user.id,
      },
      include: {
        aliases: {
          where: {
            mode: 'mailbox',
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    // Get all alias IDs for this mailbox
    const aliasIds = mailbox.aliases.map(a => a.id)

    // Count emails through aliases
    const emailCount = await prisma.emailLog.count({
      where: {
        aliasId: {
          in: aliasIds,
        },
        status: 'received',
      },
    })

    // Calculate storage used (sum of email sizes)
    const emailSizes = await prisma.emailLog.aggregate({
      where: {
        aliasId: {
          in: aliasIds,
        },
        status: 'received',
      },
      _sum: {
        size: true,
      },
    })

    const totalBytes = emailSizes._sum.size || 0
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
      stats: {
        totalEmails: emailCount,
        activeAliases: mailbox.aliases.length,
        storageUsed,
        storageBytes: totalBytes,
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
