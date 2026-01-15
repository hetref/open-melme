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
import { resolveConversationId, generateMessageId } from '@/lib/email'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { simpleParser } from 'mailparser'

const S3_BUCKET = process.env.AWS_BUCKET_NAME

if (!S3_BUCKET) {
  console.error('CRITICAL: AWS_BUCKET_NAME environment variable is not set!')
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

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
      text, // TEXT ONLY - NO HTML ALLOWED
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

    // Check if this is using an alias
    let alias = null
    let fromEmail = null
    let senderName = null

    if (aliasId.startsWith('mailbox-')) {
      return NextResponse.json(
        { error: 'Direct mailbox sending is not supported. Please use an alias.' },
        { status: 400 }
      )
    }

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

    // Use mailbox senderName for sender identity
    senderName = alias.mailbox.senderName

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

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Email body is required' },
        { status: 400 }
      )
    }

    // TEXT ONLY - No HTML processing
    const finalText = text.trim()

    // Handle reply threading
    let replyToMessageId = null
    let replyReferences = null
    let conversationId = null
    let messageId = null
    let finalSubject = subject

    // Generate Message-ID for this email
    const domain = alias.domain.fullDomain
    messageId = generateMessageId(domain)

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

      // Use conversation ID from parent
      conversationId = originalEmail.conversationId
      replyToMessageId = originalEmail.messageId

      // Build References header (parent's references + parent's message-id)
      if (originalEmail.references) {
        replyReferences = `${originalEmail.references} ${originalEmail.messageId}`
      } else {
        replyReferences = originalEmail.messageId
      }

      // Build reply subject
      finalSubject = buildReplySubject(originalEmail.subject || subject)
    } else {
      // New conversation - generate new conversation ID
      conversationId = await resolveConversationId({
        messageId,
        inReplyTo: null,
        references: null,
      })
    }

    // Fetch attachments from S3 and prepare metadata
    const attachments = []
    const attachmentMetadata = [] // Store metadata for DB records
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
          else if (filename.match(/\.(doc|docx)$/i)) contentType = 'application/msword'
          else if (filename.match(/\.(xls|xlsx)$/i)) contentType = 'application/vnd.ms-excel'

          attachments.push({
            filename,
            contentType,
            content: buffer,
          })

          // Store metadata for creating EmailAttachment records
          attachmentMetadata.push({
            filename,
            mimeType: contentType,
            size: buffer.length,
            s3Bucket: S3_BUCKET,
            s3Key: key,
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
        html: '', // No HTML
        attachments,
      })
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Build raw MIME email (TEXT ONLY)
    let rawMessage
    try {
      rawMessage = buildRawMimeEmail({
        from: `${senderName} <${fromEmail}>`, // Include sender name
        to: sanitizedTo,
        cc: sanitizedCc,
        bcc: sanitizedBcc,
        subject: finalSubject,
        text: finalText,
        html: '', // NO HTML - text only
        attachments,
        messageId,
        inReplyTo: replyToMessageId,
        references: replyReferences,
        domain: alias.domain.fullDomain,
      })
    } catch (error) {
      console.error('Error building MIME message:', error)
      return NextResponse.json(
        { error: 'Failed to build email message' },
        { status: 500 }
      )
    }

    // Generate body preview (first 200 chars)
    const bodyPreview = finalText.slice(0, 200)

    // Create new EmailLog entry
    const emailLog = await prisma.emailLog.create({
      data: {
        userId: session.user.id,
        domainId: alias.domainId,
        aliasId: aliasId.startsWith('mailbox-') ? null : aliasId,
        fromEmail,
        toEmail: allRecipients.join(', '),
        subject: finalSubject,
        status: 'pending',
        pendingReason: 'Building email',
        size: Buffer.byteLength(rawMessage, 'utf8'),
        s3Bucket: S3_BUCKET,
        s3Key: `emails-sent/${null}.eml`, // Will update after creation
        attachmentsStatus: attachments.length > 0 ? 'completed' : 'not_processed',
        conversationId,
        messageId,
        inReplyTo: replyToMessageId,
        references: replyReferences,
      },
    })

    // Update S3 key with actual emailLog ID
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { s3Key: `emails-sent/${emailLog.id}.eml` },
    })

    // Prepare S3 key for .eml file
    const s3Key = `emails-sent/${emailLog.id}.eml`

    // Validate S3_BUCKET is set
    if (!S3_BUCKET) {
      throw new Error('AWS_BUCKET_NAME environment variable is not configured')
    }

    console.log(`Preparing to upload to S3 - Bucket: ${S3_BUCKET}, Key: ${s3Key}`)

    // Step 1: Upload .eml to S3 BEFORE sending
    try {
      const putCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: Buffer.from(rawMessage, 'utf-8'),
        ContentType: 'message/rfc822',
      })

      await s3Client.send(putCommand)
      console.log(`Uploaded outbound email to S3: ${S3_BUCKET}/${s3Key}`)

      // Create EmailAttachment records for outbound attachments
      if (attachmentMetadata.length > 0) {
        try {
          await prisma.emailAttachment.createMany({
            data: attachmentMetadata.map(att => ({
              emailLogId: emailLog.id,
              filename: att.filename,
              mimeType: att.mimeType,
              size: att.size,
              s3Bucket: att.s3Bucket,
              s3Key: att.s3Key,
            })),
          })
          console.log(`Created ${attachmentMetadata.length} EmailAttachment record(s)`)
        } catch (attachError) {
          console.error('Error creating EmailAttachment records:', attachError)
          // Don't fail the email send if attachment records fail
        }
      }

      // Update status to indicate S3 upload complete
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          pendingReason: 'Email stored, sending via SES',
        },
      })
    } catch (error) {
      console.error('Error uploading .eml to S3:', error)

      // Update email log to failed
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'failed',
          error: `S3 upload failed: ${error.message}`,
          pendingReason: null,
        },
      })

      return NextResponse.json(
        { error: `Failed to store email: ${error.message}` },
        { status: 500 }
      )
    }

    // Step 2: Send via SES
    try {
      const command = new SendEmailCommand({
        FromEmailAddress: `${senderName} <${fromEmail}>`, // Include sender name
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

      // Update email log to failed (but .eml is still in S3)
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
