import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { generatePresignedUrl } from '@/lib/s3'
import { simpleParser } from 'mailparser'
import { fetchEmailFromS3 } from '@/lib/s3'

/**
 * GET /api/emails/[emailId]
 * Get email details with optional content
 * Query params:
 *   - view=metadata (default) - returns email metadata only
 *   - view=preview - returns parsed email preview (text/html)
 *   - view=presigned - returns presigned S3 URL for direct download
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

    const { emailId } = await params
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'metadata'

    // Get email log and verify ownership
    const emailLog = await prisma.emailLog.findFirst({
      where: {
        id: emailId,
        userId: session.user.id,
      },
      include: {
        alias: {
          select: {
            localPart: true,
            forwardTo: true,
          },
        },
        domain: {
          select: {
            fullDomain: true,
          },
        },
      },
    })

    if (!emailLog) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    // Base response with metadata
    const response = {
      id: emailLog.id,
      from: emailLog.fromEmail,
      to: emailLog.toEmail,
      subject: emailLog.subject,
      status: emailLog.status,
      size: emailLog.size,
      receivedAt: emailLog.createdAt,
      alias: emailLog.alias ? {
        localPart: emailLog.alias.localPart,
        forwardTo: emailLog.alias.forwardTo,
      } : null,
      domain: emailLog.domain.fullDomain,
    }

    // Handle different view modes
    if (view === 'presigned') {
      if (!emailLog.s3Bucket || !emailLog.s3Key) {
        return NextResponse.json(
          { error: 'Email not stored in S3' },
          { status: 404 }
        )
      }

      const presignedUrl = await generatePresignedUrl(
        emailLog.s3Bucket,
        emailLog.s3Key,
        3600 // 1 hour expiry
      )

      return NextResponse.json({
        ...response,
        presignedUrl,
        expiresIn: 3600,
      })
    }

    if (view === 'preview') {
      if (!emailLog.s3Bucket || !emailLog.s3Key) {
        return NextResponse.json(
          { error: 'Email not stored in S3' },
          { status: 404 }
        )
      }

      // Fetch and parse email
      const rawEmail = await fetchEmailFromS3(emailLog.s3Bucket, emailLog.s3Key)
      const parsed = await simpleParser(rawEmail)

      // Return parsed content
      return NextResponse.json({
        ...response,
        content: {
          text: parsed.text,
          html: parsed.html,
          attachments: parsed.attachments.map(att => ({
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
          })),
        },
      })
    }

    // Default: metadata only
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching email:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email' },
      { status: 500 }
    )
  }
}
