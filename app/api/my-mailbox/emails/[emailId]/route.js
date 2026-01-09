import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validateMailboxSession } from '@/lib/mailbox'
import prisma from '@/lib/prisma'
import { fetchEmailFromS3 } from '@/lib/s3'
import { simpleParser } from 'mailparser'
import { cookies } from 'next/headers'
import { generateSafeEmailVariants } from '@/lib/email-sanitizer'

export async function GET(req, { params }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get and validate mailbox session
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('melme_mailbox_session')?.value

    const mailboxSession = await validateMailboxSession(sessionId, session.user.id)

    if (!mailboxSession) {
      return NextResponse.json(
        { error: 'Invalid or expired mailbox session' },
        { status: 401 }
      )
    }

    const { emailId } = await params

    // Get aliases for this mailbox
    const aliases = await prisma.alias.findMany({
      where: {
        mailboxId: mailboxSession.mailbox.id,
      },
      select: {
        id: true,
      },
    })

    const aliasIds = aliases.map((alias) => alias.id)

    // Get email details
    const email = await prisma.emailLog.findFirst({
      where: {
        id: emailId,
        aliasId: {
          in: aliasIds,
        },
      },
      include: {
        alias: {
          select: {
            localPart: true,
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    // If no S3 data, return basic info
    if (!email.s3Bucket || !email.s3Key) {
      return NextResponse.json({
        email: {
          id: email.id,
          fromEmail: email.fromEmail,
          toEmail: email.toEmail,
          subject: email.subject,
          status: email.status,
          createdAt: email.createdAt,
          size: email.size,
          attachmentsStatus: email.attachmentsStatus,
          attachmentsError: email.attachmentsError,
          processedAttachments: email.attachments || [],
          body: {
            text: 'Email content not available',
            html: '<p>Email content not available</p>',
          },
        },
      })
    }

    // Fetch email from S3
    const rawEmail = await fetchEmailFromS3(email.s3Bucket, email.s3Key)

    // Parse email
    const parsed = await simpleParser(rawEmail)

    // Extract headers
    const headers = {}
    for (const [key, value] of parsed.headers) {
      headers[key] = value
    }

    // Count attachments from parsed email
    const attachmentsCount = parsed.attachments?.length || 0

    // Generate BOTH safe HTML variants from raw HTML
    // CRITICAL: Never re-sanitize already sanitized HTML
    const rawHtml = parsed.html || parsed.textAsHtml || ''
    const { safeHtmlNoImages, safeHtmlWithImages, hasImages } = generateSafeEmailVariants(rawHtml)

    return NextResponse.json({
      email: {
        id: email.id,
        fromEmail: email.fromEmail,
        toEmail: email.toEmail,
        subject: email.subject,
        status: email.status,
        createdAt: email.createdAt,
        size: email.size,
        attachmentsStatus: email.attachmentsStatus,
        attachmentsError: email.attachmentsError,
        attachmentsCount,
        processedAttachments: email.attachments || [],
        headers: {
          from: parsed.from?.text,
          to: parsed.to?.text,
          cc: parsed.cc?.text,
          date: parsed.date,
          replyTo: parsed.replyTo?.text,
        },
        body: {
          text: parsed.text || '',
          safeHtmlNoImages,
          safeHtmlWithImages,
          hasImages,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching email details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email details' },
      { status: 500 }
    )
  }
}
