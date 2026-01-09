import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

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
            emailAlias: true,
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

    // Handle mode change
    if (mode !== undefined) {
      if (mode !== 'forward' && mode !== 'mailbox') {
        return NextResponse.json(
          { error: 'Mode must be either "forward" or "mailbox"' },
          { status: 400 }
        )
      }
      updateData.mode = mode

      // When switching to mailbox mode, clear forwardTo and set mailboxId
      if (mode === 'mailbox') {
        if (!mailboxId) {
          return NextResponse.json(
            { error: 'mailboxId is required when switching to mailbox mode' },
            { status: 400 }
          )
        }

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
        updateData.forwardTo = null
      }

      // When switching to forward mode, clear mailboxId and require forwardTo
      if (mode === 'forward') {
        if (!forwardTo) {
          return NextResponse.json(
            { error: 'forwardTo is required when switching to forward mode' },
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
        updateData.mailboxId = null
      }
    } else {
      // If not changing mode, only allow updating forwardTo if in forward mode
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
      }
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean' },
          { status: 400 }
        )
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

    // Delete alias
    await prisma.alias.delete({
      where: {
        id: aliasId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Alias deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting alias:', error)
    return NextResponse.json(
      { error: 'Failed to delete alias' },
      { status: 500 }
    )
  }
}
