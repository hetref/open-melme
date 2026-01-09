import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validateMailboxSession } from '@/lib/mailbox'
import prisma from '@/lib/prisma'
import { fetchEmailFromS3, generatePresignedDownloadUrl } from '@/lib/s3'
import { simpleParser } from 'mailparser'
import { cookies } from 'next/headers'

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

    const { emailId, attachmentIndex } = await params
    const attachmentIdx = parseInt(attachmentIndex, 10)

    if (isNaN(attachmentIdx) || attachmentIdx < 0) {
      return NextResponse.json(
        { error: 'Invalid attachment index' },
        { status: 400 }
      )
    }

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
    })

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    // Check if email has S3 data
    if (!email.s3Bucket || !email.s3Key) {
      return NextResponse.json(
        { error: 'Email content not available' },
        { status: 404 }
      )
    }

    // Fetch email from S3 and parse
    const rawEmail = await fetchEmailFromS3(email.s3Bucket, email.s3Key)
    const parsed = await simpleParser(rawEmail)

    // Check if attachment exists
    if (!parsed.attachments || attachmentIdx >= parsed.attachments.length) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    const attachment = parsed.attachments[attachmentIdx]

    // Generate a pre-signed URL with 60 second expiration
    // This ensures the URL can only be used once and expires quickly
    const downloadUrl = await generatePresignedDownloadUrl(
      email.s3Bucket,
      email.s3Key,
      attachment.filename || `attachment-${attachmentIdx}`,
      60 // 60 seconds expiration
    )

    return NextResponse.json({
      downloadUrl,
      filename: attachment.filename || `attachment-${attachmentIdx}`,
      contentType: attachment.contentType,
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
