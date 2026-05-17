import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getValidatedMailboxSession } from '@/lib/mailboxAuth'
import { generatePresignedDownloadUrl } from '@/lib/s3'

// GET /api/my-mailbox/attachments/[attachmentId]/download
export async function GET(request, { params }) {
  try {
    // Validate mailbox session (accepts Bearer token or cookie)
    const cookieStore = await cookies()
    const mailboxSession = await getValidatedMailboxSession(request, cookieStore)

    if (!mailboxSession) {
      return NextResponse.json({ error: 'Invalid or expired mailbox session' }, { status: 401 })
    }

    const { attachmentId } = await params

    // Fetch attachment and verify it belongs to user's mailbox
    const attachment = await prisma.emailAttachment.findUnique({
      where: {
        id: attachmentId,
      },
      include: {
        emailLog: {
          select: {
            aliasId: true,
            alias: {
              select: {
                mailboxId: true,
              },
            },
          },
        },
      },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Verify attachment belongs to this mailbox session.
    const belongsToMailbox = attachment.emailLog.alias?.mailboxId === mailboxSession.mailbox.id

    if (!belongsToMailbox) {
      return NextResponse.json(
        { error: 'Attachment does not belong to your mailbox' },
        { status: 403 }
      )
    }

    // Generate short-lived pre-signed URL (60 seconds)
    const downloadUrl = await generatePresignedDownloadUrl(
      attachment.s3Bucket,
      attachment.s3Key,
      attachment.filename,
      60
    )

    return NextResponse.json({
      downloadUrl,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
    })
  } catch (error) {
    console.error('Error generating attachment download URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}
