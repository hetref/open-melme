import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validateMailboxSession } from '@/lib/mailbox'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

/**
 * Create a draft EmailLog entry for attachment uploads
 * POST /api/mailbox/draft
 * 
 * This creates a pending EmailLog that can be used for uploading attachments
 * before the actual email is sent.
 */
export async function POST(req) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate mailbox session
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('melme_mailbox_session')?.value
    const mailboxSession = await validateMailboxSession(sessionId, session.user.id)

    if (!mailboxSession) {
      return NextResponse.json(
        { error: 'Invalid or expired mailbox session' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { mailboxId, aliasId } = body

    // Validate mailbox ownership
    if (mailboxId !== mailboxSession.mailbox.id) {
      return NextResponse.json(
        { error: 'Mailbox mismatch' },
        { status: 403 }
      )
    }

    // Get mailbox and domain info for the draft
    let domainId = null

    if (aliasId && aliasId.startsWith('mailbox-')) {
      // Using mailbox primary
      const mailbox = await prisma.mailbox.findUnique({
        where: { id: mailboxId },
        select: { domainId: true },
      })
      domainId = mailbox?.domainId
    } else if (aliasId) {
      // Using real alias
      const alias = await prisma.alias.findUnique({
        where: { id: aliasId },
        select: { domainId: true },
      })
      domainId = alias?.domainId
    }

    if (!domainId) {
      return NextResponse.json(
        { error: 'Could not determine domain for draft' },
        { status: 400 }
      )
    }

    // Create draft EmailLog
    const draft = await prisma.emailLog.create({
      data: {
        userId: session.user.id,
        domainId: domainId,
        aliasId: aliasId?.startsWith('mailbox-') ? null : aliasId,
        fromEmail: 'draft',
        toEmail: 'draft',
        subject: 'Draft',
        status: 'pending',
        pendingReason: 'Draft for attachment upload',
        size: 0,
        attachmentsStatus: 'not_processed',
      },
    })

    return NextResponse.json({
      success: true,
      draftId: draft.id,
    })
  } catch (error) {
    console.error('Error creating draft:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create draft' },
      { status: 500 }
    )
  }
}
