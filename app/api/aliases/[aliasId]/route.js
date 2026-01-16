import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { deleteAlias } from '@/lib/alias-deletion'

/**
 * GET /api/aliases/[aliasId]
 * Get alias details with email statistics
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

    // Fetch alias with domain and email counts
    const alias = await prisma.alias.findFirst({
      where: {
        id: aliasId,
        userId: session.user.id,
      },
      include: {
        domain: {
          select: {
            id: true,
            fullDomain: true,
            verificationStatus: true,
            dkimStatus: true,
            lastCheckedAt: true,
          },
        },
        mailbox: {
          select: {
            id: true,
            name: true,
            slug: true,
            senderName: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            logs: true,
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

    // Get email status statistics
    const [forwardedCount, failedCount, receivedCount, pendingCount] = await Promise.all([
      prisma.emailLog.count({
        where: { aliasId, status: 'forwarded' },
      }),
      prisma.emailLog.count({
        where: { aliasId, status: 'failed' },
      }),
      prisma.emailLog.count({
        where: { aliasId, status: 'received' },
      }),
      prisma.emailLog.count({
        where: {
          aliasId,
          status: 'pending',
          pendingReason: 'domain_disconnected',
        },
      }),
    ])

    return NextResponse.json({
      alias: {
        id: alias.id,
        localPart: alias.localPart,
        mode: alias.mode,
        forwardTo: alias.forwardTo,
        mailboxId: alias.mailboxId,
        mailbox: alias.mailbox,
        isActive: alias.isActive,
        createdAt: alias.createdAt,
        updatedAt: alias.updatedAt,
        domain: alias.domain,
        fullEmail: `${alias.localPart}@${alias.domain.fullDomain}`,
        emailCount: alias._count.logs,
        statistics: {
          total: alias._count.logs,
          forwarded: forwardedCount,
          failed: failedCount,
          received: receivedCount,
          pending: pendingCount,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching alias:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alias' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/aliases/[aliasId]
 * Update an alias (forwardTo or isActive)
 */
export async function PATCH(request, { params }) {
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
    const body = await request.json()
    const { forwardTo, isActive, mode, mailboxId } = body

    // Verify alias belongs to user
    const alias = await prisma.alias.findFirst({
      where: {
        id: aliasId,
        userId: session.user.id,
      },
    })

    if (!alias) {
      return NextResponse.json(
        { error: 'Alias not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData = {}

    // Reject mode changes - mode cannot be converted
    if (mode !== undefined) {
      return NextResponse.json(
        { error: 'Alias mode cannot be changed. Create a new alias instead.' },
        { status: 400 }
      )
    }

    // Only allow updating forwardTo if in forward mode
    if (forwardTo !== undefined) {
      if (alias.mode !== 'forward') {
        return NextResponse.json(
          { error: 'Cannot update forwardTo for mailbox mode aliases' },
          { status: 400 }
        )
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(forwardTo)) {
        return NextResponse.json(
          { error: 'Invalid forward to email address' },
          { status: 400 }
        )
      }
      updateData.forwardTo = forwardTo.toLowerCase().trim()
    }

    // Only allow updating mailboxId if in mailbox mode
    if (mailboxId !== undefined) {
      if (alias.mode !== 'mailbox') {
        return NextResponse.json(
          { error: 'Cannot update mailboxId for forward mode aliases' },
          { status: 400 }
        )
      }

      if (mailboxId === null) {
        // Unassigning mailbox
        updateData.mailboxId = null
        // CRITICAL: When removing mailbox, alias becomes INACTIVE
        updateData.isActive = false
      } else {
        // Assigning/changing mailbox
        // Verify mailbox exists and belongs to user
        const mailbox = await prisma.mailbox.findFirst({
          where: {
            id: mailboxId,
            userId: session.user.id,
            isActive: true,
          },
        })

        if (!mailbox) {
          return NextResponse.json(
            { error: 'Mailbox not found or inactive' },
            { status: 404 }
          )
        }

        updateData.mailboxId = mailboxId
        // CRITICAL: When assigning mailbox, alias becomes INACTIVE
        updateData.isActive = false
      }
    }

    // Handle isActive updates
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean' },
          { status: 400 }
        )
      }

      // CRITICAL: Enforce activation rules
      if (isActive === true) {
        // Activating alias - validate requirements
        if (alias.mode === 'mailbox' && !alias.mailboxId && mailboxId === undefined) {
          return NextResponse.json(
            { error: 'Cannot activate mailbox mode alias without assigned mailbox' },
            { status: 400 }
          )
        }
        if (alias.mode === 'forward' && !alias.forwardTo && forwardTo === undefined) {
          return NextResponse.json(
            { error: 'Cannot activate forward mode alias without forwardTo address' },
            { status: 400 }
          )
        }
      }

      updateData.isActive = isActive
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update alias
    const updatedAlias = await prisma.alias.update({
      where: {
        id: aliasId,
      },
      data: updateData,
    })

    return NextResponse.json({
      alias: {
        id: updatedAlias.id,
        localPart: updatedAlias.localPart,
        mode: updatedAlias.mode,
        forwardTo: updatedAlias.forwardTo,
        mailboxId: updatedAlias.mailboxId,
        isActive: updatedAlias.isActive,
        updatedAt: updatedAlias.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating alias:', error)
    return NextResponse.json(
      { error: 'Failed to update alias' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/aliases/[aliasId]
 * Delete an alias
 * - Forward aliases: Delete immediately with minimal email logs
 * - Mailbox aliases: Reject and require explicit action via /delete endpoint
 */
export async function DELETE(request, { params }) {
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

    // Verify alias belongs to user
    const alias = await prisma.alias.findFirst({
      where: {
        id: aliasId,
        userId: session.user.id,
      },
    })

    if (!alias) {
      return NextResponse.json(
        { error: 'Alias not found' },
        { status: 404 }
      )
    }

    // CASE 1: Forward alias - delete instantly
    if (alias.mode === 'forward') {
      try {
        // Delete email logs (audit only, no attachments stored)
        await prisma.emailLog.deleteMany({
          where: { aliasId },
        })

        // Delete alias
        await prisma.alias.delete({
          where: { id: aliasId },
        })

        return NextResponse.json({
          success: true,
          message: 'Forward alias deleted successfully',
        })
      } catch (deleteError) {
        console.error('Error deleting forward alias:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete forward alias' },
          { status: 500 }
        )
      }
    }

    // CASE 2: Mailbox alias - reject and require explicit action
    if (alias.mode === 'mailbox') {
      return NextResponse.json(
        { 
          error: 'Mailbox alias requires explicit deletion action',
          code: 'MAILBOX_ALIAS_REQUIRES_ACTION',
          message: 'Use the deletion modal to choose transfer or delete action',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid alias mode' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error deleting alias:', error)
    return NextResponse.json(
      { error: 'Failed to delete alias' },
      { status: 500 }
    )
  }
}
