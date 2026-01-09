import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateMailboxSession } from '@/lib/mailbox'
import { generatePresignedDownloadUrl } from '@/lib/s3'

// GET /api/my-mailbox/attachments/[attachmentId]/download
export async function GET(request, { params }) {
  try {
    // Get user session first
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate mailbox session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('melme_mailbox_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'No mailbox session' }, { status: 401 })
    }

    const mailboxSession = await validateMailboxSession(sessionToken, session.user.id)

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
          include: {
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

    // Verify attachment belongs to user's mailbox
    if (attachment.emailLog.alias?.mailboxId !== mailboxSession.mailbox.id) {
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
