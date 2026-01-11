import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validateMailboxSession } from '@/lib/mailbox'
import { fetchEmailFromS3 } from '@/lib/s3'
import {
  buildRawMimeEmail,
  validateEmailLimits,
  sanitizeOutboundHtml,
  buildReplySubject,
  extractMessageId,
  isValidEmail,
  sanitizeEmailList
} from '@/lib/email-builder'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { simpleParser } from 'mailparser'

const S3_BUCKET = process.env.AWS_S3_BUCKET

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

/**
 * Send email or reply from mailbox
 * POST /api/mailbox/send
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

    // Parse request
    const body = await req.json()
    const {
      mailboxId,
      aliasId,
      to = [],
      cc = [],
      bcc = [],
      subject,
      html,
      text,
      replyToEmailLogId,
      attachmentKeys = [],
    } = body

    // Validate mailbox ownership
    if (mailboxId !== mailboxSession.mailbox.id) {
      return NextResponse.json(
        { error: 'Mailbox mismatch' },
        { status: 403 }
      )
    }

    // Check if this is the mailbox primary email (virtual alias)
    let alias = null
    let fromEmail = null

    if (aliasId.startsWith('mailbox-')) {
      // Using mailbox primary email
      const mailbox = await prisma.mailbox.findUnique({
        where: { id: mailboxId },
        include: {
          domain: true,
        },
      })

      if (!mailbox) {
        return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
      }

      if (!mailbox.isActive) {
        return NextResponse.json(
          { error: 'Mailbox is not active' },
          { status: 400 }
        )
      }

      // Validate domain is verified
      if (mailbox.domain.verificationStatus !== 'verified') {
        return NextResponse.json(
          { error: 'Domain is not verified. Please verify your domain before sending emails.' },
          { status: 400 }
        )
      }

      // Use mailbox email as from address
      fromEmail = mailbox.emailAlias

      // Create a virtual alias object for the rest of the logic
      const [localPart, domain] = mailbox.emailAlias.split('@')
      alias = {
        id: aliasId,
        localPart: localPart,
        mailboxId: mailbox.id,
        domainId: mailbox.domainId,
        isActive: true,
        domain: mailbox.domain,
      }
    } else {
      // Using a real alias
      alias = await prisma.alias.findUnique({
        where: { id: aliasId },
        include: {
          domain: true,
          mailbox: true,
        },
      })

      if (!alias) {
        return NextResponse.json({ error: 'Alias not found' }, { status: 404 })
      }

      if (alias.mailboxId !== mailboxId) {
        return NextResponse.json(
          { error: 'Alias does not belong to this mailbox' },
          { status: 403 }
        )
      }

      if (!alias.isActive) {
        return NextResponse.json(
          { error: 'Alias is not active' },
          { status: 400 }
        )
      }

      // Validate domain is verified
      if (alias.domain.verificationStatus !== 'verified') {
        return NextResponse.json(
          { error: 'Domain is not verified. Please verify your domain before sending emails.' },
          { status: 400 }
        )
      }

      // Build from address
      fromEmail = `${alias.localPart}@${alias.domain.fullDomain}`
    }

    // Sanitize recipients
    const sanitizedTo = sanitizeEmailList(to)
    const sanitizedCc = sanitizeEmailList(cc)
    const sanitizedBcc = sanitizeEmailList(bcc)

    // Remove alias email from recipients (don't send to self)
    const allRecipients = [
      ...sanitizedTo.filter(email => email !== fromEmail),
      ...sanitizedCc.filter(email => email !== fromEmail),
      ...sanitizedBcc.filter(email => email !== fromEmail),
    ]

    if (allRecipients.length === 0) {
      return NextResponse.json(
        { error: 'No valid recipients' },
        { status: 400 }
      )
    }

    // Validate basic email data
    if (!subject || subject.trim() === '') {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      )
    }

    if (!html && !text) {
      return NextResponse.json(
        { error: 'Email body is required' },
        { status: 400 }
      )
    }

    // Sanitize HTML
    const sanitizedHtml = sanitizeOutboundHtml(html || '')
    const finalText = text || 'This email contains HTML content.'

    // Handle reply threading
    let replyToMessageId = null
    let finalSubject = subject

    if (replyToEmailLogId) {
      // Fetch original email
      const originalEmail = await prisma.emailLog.findUnique({
        where: { id: replyToEmailLogId },
        include: {
          alias: {
            include: {
              domain: true,
            },
          },
        },
      })

      if (!originalEmail) {
        return NextResponse.json(
          { error: 'Original email not found' },
          { status: 404 }
        )
      }

      // Verify original email belongs to same mailbox
      if (originalEmail.alias?.mailboxId !== mailboxId) {
        return NextResponse.json(
          { error: 'Original email does not belong to this mailbox' },
          { status: 403 }
        )
      }

      // Fetch original email from S3 to extract Message-ID
      if (originalEmail.s3Key && originalEmail.s3Bucket) {
        try {
          const rawEmail = await fetchEmailFromS3(
            originalEmail.s3Bucket,
            originalEmail.s3Key
          )
          const parsed = await simpleParser(rawEmail)
          replyToMessageId = extractMessageId(parsed.headers)
        } catch (error) {
          console.error('Error fetching original email for threading:', error)
          // Continue without threading if we can't get Message-ID
        }
      }

      // Build reply subject
      finalSubject = buildReplySubject(originalEmail.subject || subject)
    }

    // Fetch attachments from S3
    const attachments = []
    if (attachmentKeys.length > 0) {
      for (const key of attachmentKeys) {
        try {
          const buffer = await fetchEmailFromS3(S3_BUCKET, key)

          // Extract filename from key (last part after /)
          const filename = key.split('/').pop().replace(/^\d+-[a-f0-9]+-/, '') || 'attachment'

          // Determine content type (basic detection)
          let contentType = 'application/octet-stream'
          if (filename.endsWith('.pdf')) contentType = 'application/pdf'
          else if (filename.match(/\.(jpg|jpeg)$/i)) contentType = 'image/jpeg'
          else if (filename.endsWith('.png')) contentType = 'image/png'
          else if (filename.endsWith('.txt')) contentType = 'text/plain'

          attachments.push({
            filename,
            contentType,
            content: buffer,
          })
        } catch (error) {
          console.error(`Error fetching attachment ${key}:`, error)
          return NextResponse.json(
            { error: `Failed to fetch attachment: ${key}` },
            { status: 400 }
          )
        }
      }
    }

    // Validate email limits
    try {
      validateEmailLimits({
        to: sanitizedTo,
        cc: sanitizedCc,
        bcc: sanitizedBcc,
        subject: finalSubject,
        text: finalText,
        html: sanitizedHtml,
        attachments,
      })
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Build raw MIME email
    let rawMessage
    try {
      rawMessage = buildRawMimeEmail({
        from: fromEmail,
        to: sanitizedTo,
        cc: sanitizedCc,
        bcc: sanitizedBcc,
        subject: finalSubject,
        text: finalText,
        html: sanitizedHtml,
        attachments,
        replyToMessageId,
        domain: alias.domain.fullDomain,
      })
    } catch (error) {
      console.error('Error building MIME message:', error)
      return NextResponse.json(
        { error: 'Failed to build email message' },
        { status: 500 }
      )
    }

    // Create email log entry (before sending)
    const emailLog = await prisma.emailLog.create({
      data: {
        userId: session.user.id,
        domainId: alias.domainId,
        aliasId: aliasId.startsWith('mailbox-') ? null : aliasId, // Set null for mailbox primary
        fromEmail,
        toEmail: allRecipients.join(', '),
        subject: finalSubject,
        status: 'pending',
        pendingReason: 'Sending via SES',
        size: Buffer.byteLength(rawMessage, 'utf8'),
      },
    })

    // Send via SES
    try {
      const command = new SendEmailCommand({
        FromEmailAddress: fromEmail,
        Destination: {
          ToAddresses: sanitizedTo,
          CcAddresses: sanitizedCc.length > 0 ? sanitizedCc : undefined,
          BccAddresses: sanitizedBcc.length > 0 ? sanitizedBcc : undefined,
        },
        Content: {
          Raw: {
            Data: Buffer.from(rawMessage),
          },
        },
      })

      const response = await sesClient.send(command)

      // Update email log to sent
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'sent',
          pendingReason: null,
          error: null,
        },
      })

      return NextResponse.json({
        success: true,
        messageId: response.MessageId,
        emailLogId: emailLog.id,
      })
    } catch (error) {
      console.error('Error sending email via SES:', error)

      // Update email log to failed
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'failed',
          error: error.message || 'SES sending failed',
          pendingReason: null,
        },
      })

      return NextResponse.json(
        { error: `Failed to send email: ${error.message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in send email endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
