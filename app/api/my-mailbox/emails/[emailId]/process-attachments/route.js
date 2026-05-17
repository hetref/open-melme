import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getValidatedMailboxSession } from '@/lib/mailboxAuth'
import { fetchEmailFromS3, uploadAttachmentToS3, sanitizeFilename, listS3Objects } from '@/lib/s3'
import { simpleParser } from 'mailparser'

// POST /api/my-mailbox/emails/[emailId]/process-attachments
export async function POST(request, { params }) {
  try {
    // Validate mailbox session (accepts Bearer token or cookie)
    const cookieStore = await cookies()
    const mailboxSession = await getValidatedMailboxSession(request, cookieStore)

    if (!mailboxSession) {
      return NextResponse.json({ error: 'Invalid or expired mailbox session' }, { status: 401 })
    }

    const { emailId } = await params

    // Fetch email and verify it belongs to user's mailbox
    const email = await prisma.emailLog.findUnique({
      where: {
        id: emailId,
      },
      include: {
        alias: {
          select: {
            mailboxId: true,
          },
        },
      },
    })

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    // Verify email belongs to the logged mailbox.
    if (email.alias?.mailboxId !== mailboxSession.mailbox.id) {
      return NextResponse.json({ error: 'Email does not belong to your mailbox' }, { status: 403 })
    }

    const isSentEmail = email.status === 'sent'

    // Check if email has S3 storage
    if (!email.s3Bucket || !email.s3Key) {
      return NextResponse.json({ error: 'Email not stored in S3' }, { status: 400 })
    }

    // Check current attachments status
    if (email.attachmentsStatus === 'completed') {
      // Already processed, return existing attachments
      const attachments = await prisma.emailAttachment.findMany({
        where: {
          emailLogId: emailId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      return NextResponse.json({
        message: 'Attachments already processed',
        status: 'completed',
        attachments: attachments.map(att => ({
          id: att.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
        })),
      })
    }

    if (email.attachmentsStatus === 'processing') {
      return NextResponse.json(
        { error: 'Attachments are currently being processed. Please wait.' },
        { status: 409 }
      )
    }

    // Update status to processing
    await prisma.emailLog.update({
      where: {
        id: emailId,
      },
      data: {
        attachmentsStatus: 'processing',
        attachmentsError: null,
      },
    })

    try {
      // BRANCH: Handle sent emails differently from received emails
      if (isSentEmail) {
        // For sent emails: scan sent-attachments/<emailId>/ prefix in S3
        const sentAttachmentsPrefix = `sent-attachments/${emailId}/`

        console.log(`Scanning S3 for sent attachments: ${sentAttachmentsPrefix}`)

        const s3Objects = await listS3Objects(email.s3Bucket, sentAttachmentsPrefix)

        if (!s3Objects || s3Objects.length === 0) {
          // No attachments found in S3
          await prisma.emailLog.update({
            where: { id: emailId },
            data: { attachmentsStatus: 'completed' },
          })

          return NextResponse.json({
            message: 'No attachments found for this sent email',
            status: 'completed',
            attachments: [],
          })
        }

        // Create EmailAttachment records for each file found
        const attachmentRecords = []

        for (const s3Object of s3Objects) {
          // Extract filename from S3 key
          const filename = s3Object.Key.split('/').pop().replace(/^\d+-[a-f0-9]+-/, '') || 'attachment'

          // Detect MIME type from filename
          let mimeType = 'application/octet-stream'
          if (filename.endsWith('.pdf')) mimeType = 'application/pdf'
          else if (filename.match(/\.(jpg|jpeg)$/i)) mimeType = 'image/jpeg'
          else if (filename.endsWith('.png')) mimeType = 'image/png'
          else if (filename.endsWith('.txt')) mimeType = 'text/plain'
          else if (filename.match(/\.(doc|docx)$/i)) mimeType = 'application/msword'
          else if (filename.match(/\.(xls|xlsx)$/i)) mimeType = 'application/vnd.ms-excel'
          else if (filename.endsWith('.zip')) mimeType = 'application/zip'

          // Create database record
          const attachmentRecord = await prisma.emailAttachment.create({
            data: {
              emailLogId: emailId,
              filename: filename,
              mimeType: mimeType,
              size: s3Object.Size,
              s3Bucket: email.s3Bucket,
              s3Key: s3Object.Key,
            },
          })

          attachmentRecords.push(attachmentRecord)
        }

        // Update status to completed
        await prisma.emailLog.update({
          where: { id: emailId },
          data: { attachmentsStatus: 'completed' },
        })

        return NextResponse.json({
          message: `Successfully processed ${attachmentRecords.length} attachment(s) from sent email`,
          status: 'completed',
          attachments: attachmentRecords.map(att => ({
            id: att.id,
            filename: att.filename,
            mimeType: att.mimeType,
            size: att.size,
          })),
        })
      }

      // RECEIVED EMAILS: Original behavior - parse .eml and extract attachments
      // Fetch raw email from S3
      const rawEmail = await fetchEmailFromS3(email.s3Bucket, email.s3Key)

      // Parse email to extract attachments
      const parsed = await simpleParser(rawEmail)

      if (!parsed.attachments || parsed.attachments.length === 0) {
        // No attachments found, mark as completed
        await prisma.emailLog.update({
          where: {
            id: emailId,
          },
          data: {
            attachmentsStatus: 'completed',
          },
        })

        return NextResponse.json({
          message: 'No attachments found in this email',
          status: 'completed',
          attachments: [],
        })
      }

      // Extract the emailObjectKey from s3Key (remove 'emails-receiver/' prefix if present)
      const emailObjectKey = email.s3Key.replace(/^emails-receiver\//, '')

      // Process each attachment
      const attachmentRecords = []

      for (let index = 0; index < parsed.attachments.length; index++) {
        const attachment = parsed.attachments[index]

        // Sanitize filename
        const sanitizedFilename = sanitizeFilename(attachment.filename || `attachment-${index}`)

        // Construct S3 key: email-attachments/<emailObjectKey>/<index>-<filename>
        const attachmentS3Key = `email-attachments/${emailObjectKey}/${index}-${sanitizedFilename}`

        // Upload attachment to S3
        await uploadAttachmentToS3(
          email.s3Bucket,
          attachmentS3Key,
          attachment.content,
          attachment.contentType || 'application/octet-stream'
        )

        // Create database record
        const attachmentRecord = await prisma.emailAttachment.create({
          data: {
            emailLogId: emailId,
            filename: attachment.filename || sanitizedFilename,
            mimeType: attachment.contentType || 'application/octet-stream',
            size: attachment.size || attachment.content.length,
            s3Bucket: email.s3Bucket,
            s3Key: attachmentS3Key,
          },
        })

        attachmentRecords.push(attachmentRecord)
      }

      // Update status to completed
      await prisma.emailLog.update({
        where: {
          id: emailId,
        },
        data: {
          attachmentsStatus: 'completed',
        },
      })

      return NextResponse.json({
        message: `Successfully processed ${attachmentRecords.length} attachment(s)`,
        status: 'completed',
        attachments: attachmentRecords.map(att => ({
          id: att.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
        })),
      })
    } catch (processingError) {
      // Update status to failed
      await prisma.emailLog.update({
        where: {
          id: emailId,
        },
        data: {
          attachmentsStatus: 'failed',
          attachmentsError: processingError.message,
        },
      })

      console.error('Error processing attachments:', processingError)
      return NextResponse.json(
        { error: `Failed to process attachments: ${processingError.message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in process-attachments endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
