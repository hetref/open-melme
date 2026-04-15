import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { bulkDeleteAliases } from '@/lib/alias-deletion'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_TAGS = 20
const MAX_TAG_LENGTH = 30

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return null
  }

  const normalized = []
  const seen = new Set()

  for (const rawTag of tags) {
    if (typeof rawTag !== 'string') {
      continue
    }

    const tag = rawTag.trim()
    if (!tag) {
      continue
    }

    if (tag.length > MAX_TAG_LENGTH) {
      return { error: `Each tag must be ${MAX_TAG_LENGTH} characters or less` }
    }

    const canonical = tag.toLowerCase()
    if (!seen.has(canonical)) {
      seen.add(canonical)
      normalized.push(tag)
    }
  }

  if (normalized.length > MAX_TAGS) {
    return { error: `A mailbox can have at most ${MAX_TAGS} tags` }
  }

  return { tags: normalized }
}

// GET /api/mailboxes/[mailboxId] - Get single mailbox details
export async function GET(req, { params }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId } = await params

    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: mailboxId,
        userId: session.user.id,
      },
      include: {
        aliases: {
          select: {
            id: true,
            localPart: true,
            personalEmail: true,
            mode: true,
            domainId: true,
            isActive: true,
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
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    const assignedPersonalEmails = [...new Set(
      mailbox.aliases
        .map((alias) => alias.personalEmail)
        .filter(Boolean)
    )]
    const { slug: _slug, ...mailboxWithoutSlug } = mailbox

    return NextResponse.json({
      mailbox: {
        ...mailboxWithoutSlug,
        personalEmail: mailboxWithoutSlug.personalEmail || assignedPersonalEmails[0] || null,
        assignedPersonalEmails,
      },
    })
  } catch (error) {
    console.error('Error fetching mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mailbox' },
      { status: 500 }
    )
  }
}

// PATCH /api/mailboxes/[mailboxId] - Update mailbox (status or details)
export async function PATCH(req, { params }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId } = await params
    const { isActive, name, senderName, personalEmail, description, tags } = await req.json()

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

    // Prepare update data
    const updateData = {}

    // Handle status toggle
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean' },
          { status: 400 }
        )
      }
      updateData.isActive = isActive
    }

    // Handle metadata updates
    if (name !== undefined) {
      const trimmedName = name.trim()
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        )
      }
      if (trimmedName.length > 100) {
        return NextResponse.json(
          { error: 'Name must be 100 characters or less' },
          { status: 400 }
        )
      }
      updateData.name = trimmedName
    }

    if (senderName !== undefined) {
      const trimmedSender = senderName.trim()
      if (!trimmedSender) {
        return NextResponse.json(
          { error: 'Sender name cannot be empty' },
          { status: 400 }
        )
      }
      if (trimmedSender.length > 100) {
        return NextResponse.json(
          { error: 'Sender name must be 100 characters or less' },
          { status: 400 }
        )
      }
      updateData.senderName = trimmedSender
    }

    if (description !== undefined) {
      if (description === null || description === '') {
        updateData.description = null
      } else {
        const trimmedDesc = description.trim()
        if (trimmedDesc.length > 500) {
          return NextResponse.json(
            { error: 'Description must be 500 characters or less' },
            { status: 400 }
          )
        }
        updateData.description = trimmedDesc
      }
    }

    if (personalEmail !== undefined) {
      if (personalEmail === null || personalEmail === '') {
        return NextResponse.json(
          { error: 'Personal email cannot be empty' },
          { status: 400 }
        )
      }

      const normalizedPersonalEmail = personalEmail.trim().toLowerCase()
      if (!emailRegex.test(normalizedPersonalEmail)) {
        return NextResponse.json(
          { error: 'Invalid personal email address' },
          { status: 400 }
        )
      }

      updateData.personalEmail = normalizedPersonalEmail
    }

    if (tags !== undefined) {
      const result = normalizeTags(tags)
      if (!result || result.error) {
        return NextResponse.json(
          { error: result?.error || 'Invalid tags payload' },
          { status: 400 }
        )
      }

      updateData.tags = result.tags
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update mailbox
    const updatedMailbox = await prisma.mailbox.update({
      where: { id: mailboxId },
      data: updateData,
      include: {
        aliases: {
          select: {
            id: true,
            localPart: true,
            personalEmail: true,
            mode: true,
            domainId: true,
            isActive: true,
            domain: {
              select: {
                fullDomain: true,
              },
            },
          },
        },
      },
    })

    const assignedPersonalEmails = [...new Set(
      updatedMailbox.aliases
        .map((alias) => alias.personalEmail)
        .filter(Boolean)
    )]
    const { slug: _slug, ...updatedMailboxWithoutSlug } = updatedMailbox

    return NextResponse.json({
      message: 'Mailbox updated successfully',
      mailbox: {
        ...updatedMailboxWithoutSlug,
        personalEmail: updatedMailboxWithoutSlug.personalEmail || assignedPersonalEmails[0] || null,
        assignedPersonalEmails,
      },
    })
  } catch (error) {
    console.error('Error updating mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to update mailbox' },
      { status: 500 }
    )
  }
}

// DELETE /api/mailboxes/[mailboxId] - Delete mailbox with user choice handling
export async function DELETE(req, { params }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId } = await params
    const { action, aliasForwarding } = await req.json().catch(() => ({ action: null }))

    // Verify mailbox belongs to user
    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: mailboxId,
        userId: session.user.id,
      },
      include: {
        aliases: {
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

    // If no action provided, return preview data
    if (!action) {
      return NextResponse.json({
        requiresAction: mailbox.aliases.length > 0,
        mailbox: {
          id: mailbox.id,
          name: mailbox.name,
        },
        aliases: mailbox.aliases.map(alias => ({
          id: alias.id,
          email: `${alias.localPart}@${alias.domain.fullDomain}`,
          isActive: alias.isActive,
        })),
        message: mailbox.aliases.length > 0
          ? 'This mailbox has assigned aliases. Choose how to handle them.'
          : 'This mailbox has no assigned aliases and can be deleted safely.',
      })
    }

    // Validate action
    if (action !== 'convert' && action !== 'delete') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "convert" or "delete"' },
        { status: 400 }
      )
    }

    // Handle based on user's choice
    if (action === 'convert') {
      // Convert aliases to forwarding mode
      if (!aliasForwarding || typeof aliasForwarding !== 'object') {
        return NextResponse.json(
          { error: 'aliasForwarding map is required for convert action' },
          { status: 400 }
        )
      }

      // Validate all aliases have forwarding addresses
      for (const alias of mailbox.aliases) {
        if (!aliasForwarding[alias.id]) {
          return NextResponse.json(
            { error: `Missing forwarding address for alias ${alias.id}` },
            { status: 400 }
          )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(aliasForwarding[alias.id])) {
          return NextResponse.json(
            { error: `Invalid forwarding email for alias ${alias.id}` },
            { status: 400 }
          )
        }
      }

      // Convert aliases in a transaction
      await prisma.$transaction(async (tx) => {
        // Update all aliases to forward mode
        for (const alias of mailbox.aliases) {
          await tx.alias.update({
            where: { id: alias.id },
            data: {
              mode: 'forward',
              forwardTo: aliasForwarding[alias.id].toLowerCase().trim(),
              mailboxId: null,
              isActive: true, // Activate after conversion
            },
          })
        }

        // Delete all sessions
        await tx.mailboxSession.deleteMany({
          where: { mailboxId },
        })

        // Delete mailbox
        await tx.mailbox.delete({
          where: { id: mailboxId },
        })
      })

      return NextResponse.json({
        message: 'Mailbox deleted and aliases converted to forwarding mode',
        aliasesConverted: mailbox.aliases.length,
      })
    }

    if (action === 'delete') {
      // Delete aliases and all related data
      const aliasIds = mailbox.aliases.map(alias => alias.id)

      // Delete mailbox-specific data first in transaction
      await prisma.$transaction(async (tx) => {
        // Delete all sessions
        await tx.mailboxSession.deleteMany({
          where: { mailboxId },
        })

        // Delete mailbox
        await tx.mailbox.delete({
          where: { id: mailboxId },
        })
      })

      // Then bulk delete aliases with S3 cleanup (if any aliases exist)
      let deletionResults = null
      if (aliasIds.length > 0) {
        try {
          deletionResults = await bulkDeleteAliases(aliasIds, session.user.id)
        } catch (deleteError) {
          console.error('Error during alias bulk deletion:', deleteError)
          return NextResponse.json(
            {
              error: 'Mailbox deleted but failed to delete some aliases',
              details: deleteError.message,
            },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        message: 'Mailbox and all aliases deleted successfully',
        aliasesDeleted: aliasIds.length,
        s3ObjectsDeleted: deletionResults?.s3Stats.objectsDeleted || 0,
      })
    }
  } catch (error) {
    console.error('Error deleting mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to delete mailbox' },
      { status: 500 }
    )
  }
}
