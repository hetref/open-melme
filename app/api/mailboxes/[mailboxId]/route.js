import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/mailboxes/[mailboxId] - Get single mailbox details
export async function GET(req, { params }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId } = params

    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: mailboxId,
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
        aliases: {
          select: {
            id: true,
            localPart: true,
            isActive: true,
          },
        },
        sessions: {
          where: {
            revokedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            expiresAt: true,
            userAgent: true,
            ipAddress: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    return NextResponse.json({ mailbox })
  } catch (error) {
    console.error('Error fetching mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mailbox' },
      { status: 500 }
    )
  }
}

// PATCH /api/mailboxes/[mailboxId] - Update mailbox (toggle active status)
export async function PATCH(req, { params }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId } = params
    const { isActive } = await req.json()

    // Verify mailbox belongs to user
    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: mailboxId,
        userId: session.user.id,
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    // Update mailbox
    const updatedMailbox = await prisma.mailbox.update({
      where: { id: mailboxId },
      data: { isActive },
      include: {
        domain: {
          select: {
            fullDomain: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Mailbox updated successfully',
      mailbox: updatedMailbox,
    })
  } catch (error) {
    console.error('Error updating mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to update mailbox' },
      { status: 500 }
    )
  }
}

// DELETE /api/mailboxes/[mailboxId] - Delete mailbox
export async function DELETE(req, { params }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId } = params

    // Verify mailbox belongs to user
    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: mailboxId,
        userId: session.user.id,
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    // Delete mailbox and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all sessions
      await tx.mailboxSession.deleteMany({
        where: { mailboxId },
      })

      // Update aliases to remove mailbox reference
      await tx.alias.updateMany({
        where: { mailboxId },
        data: {
          mailboxId: null,
          mode: 'forward',
          forwardTo: '', // Will need to be updated by user
          isActive: false, // Deactivate until user sets forwarding
        },
      })

      // Delete mailbox
      await tx.mailbox.delete({
        where: { id: mailboxId },
      })
    })

    return NextResponse.json({
      message: 'Mailbox deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to delete mailbox' },
      { status: 500 }
    )
  }
}
