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

    // Get email details to find conversation
    const email = await prisma.emailLog.findFirst({
      where: {
        id: emailId,
        OR: [
          {
            aliasId: {
              in: aliasIds,
            },
          },
          {
            aliasId: null,
            userId: session.user.id,
            fromEmail: mailboxSession.mailbox.emailAlias,
          },
        ],
      },
      select: {
        conversationId: true,
      },
    })

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    // Get all emails in the conversation
    // If conversationId is null, just get this one email
    const whereConversation = email.conversationId
      ? { conversationId: email.conversationId }
      : { id: emailId }

    const conversationEmails = await prisma.emailLog.findMany({
      where: {
        ...whereConversation,
        OR: [
          {
            aliasId: {
              in: aliasIds,
            },
          },
          {
            aliasId: null,
            userId: session.user.id,
            fromEmail: mailboxSession.mailbox.emailAlias,
          },
        ],
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
      orderBy: {
        createdAt: 'asc', // Show in chronological order
      },
    })

    // Parse each email's content
    const parsedEmails = await Promise.all(
      conversationEmails.map(async (emailItem) => {
        // If no S3 data, return basic info
        if (!emailItem.s3Bucket || !emailItem.s3Key) {
          return {
            id: emailItem.id,
            fromEmail: emailItem.fromEmail,
            toEmail: emailItem.toEmail,
            subject: emailItem.subject,
            status: emailItem.status,
            createdAt: emailItem.createdAt,
            size: emailItem.size,
            attachmentsStatus: emailItem.attachmentsStatus,
            attachmentsError: emailItem.attachmentsError,
            processedAttachments: emailItem.attachments || [],
            headers: {
              from: emailItem.fromEmail,
              to: emailItem.toEmail,
              date: emailItem.createdAt,
            },
            body: {
              text: 'Email content not available',
              safeHtmlNoImages: '<p>Email content not available</p>',
              safeHtmlWithImages: '<p>Email content not available</p>',
              hasImages: false,
            },
          }
        }

        try {
          // Fetch email from S3
          const rawEmail = await fetchEmailFromS3(emailItem.s3Bucket, emailItem.s3Key)

          // Parse email
          const parsed = await simpleParser(rawEmail)

          // Count attachments from parsed email
          const attachmentsCount = parsed.attachments?.length || 0

          // Generate BOTH safe HTML variants from raw HTML
          const rawHtml = parsed.html || parsed.textAsHtml || ''
          const { safeHtmlNoImages, safeHtmlWithImages, hasImages } = generateSafeEmailVariants(rawHtml)

          return {
            id: emailItem.id,
            fromEmail: emailItem.fromEmail,
            toEmail: emailItem.toEmail,
            subject: emailItem.subject,
            status: emailItem.status,
            createdAt: emailItem.createdAt,
            size: emailItem.size,
            attachmentsStatus: emailItem.attachmentsStatus,
            attachmentsError: emailItem.attachmentsError,
            attachmentsCount,
            processedAttachments: emailItem.attachments || [],
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
          }
        } catch (error) {
          console.error(`Error parsing email ${emailItem.id}:`, error)
          return {
            id: emailItem.id,
            fromEmail: emailItem.fromEmail,
            toEmail: emailItem.toEmail,
            subject: emailItem.subject,
            status: emailItem.status,
            createdAt: emailItem.createdAt,
            size: emailItem.size,
            attachmentsStatus: emailItem.attachmentsStatus,
            attachmentsError: emailItem.attachmentsError,
            processedAttachments: emailItem.attachments || [],
            headers: {
              from: emailItem.fromEmail,
              to: emailItem.toEmail,
              date: emailItem.createdAt,
            },
            body: {
              text: 'Error loading email content',
              safeHtmlNoImages: '<p>Error loading email content</p>',
              safeHtmlWithImages: '<p>Error loading email content</p>',
              hasImages: false,
            },
          }
        }
      })
    )

    return NextResponse.json({
      conversation: {
        conversationId: email.conversationId || emailId,
        emails: parsedEmails,
        messageCount: parsedEmails.length,
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
