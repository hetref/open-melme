import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyDomainConnection } from '@/lib/ses'
import { fetchEmailFromS3 } from '@/lib/s3'
import { simpleParser } from 'mailparser'
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

/**
 * POST /api/domains/[domainId]/recheck
 * Recheck domain connection status and process pending emails if reconnected
 */
export async function POST(request, { params }) {
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

    const { domainId } = await params
    const body = await request.json()
    const { aliasId } = body // Optional: if provided, only process this alias's pending emails

    // Fetch domain
    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        userId: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    const previousStatus = domain.verificationStatus

    // Recheck domain connection
    console.log('Rechecking domain connection for:', domain.fullDomain)
    const connectionStatus = await verifyDomainConnection(domain.fullDomain)

    // Update domain status
    await prisma.domain.update({
      where: { id: domain.id },
      data: {
        verificationStatus: connectionStatus.verificationStatus,
        dkimStatus: connectionStatus.dkimStatus,
        lastCheckedAt: new Date(),
      },
    })

    const newStatus = connectionStatus.verificationStatus

    // Check if we should process pending emails
    const shouldProcessPending = previousStatus === 'pending' && newStatus === 'verified'

    if (!shouldProcessPending) {
      return NextResponse.json({
        domain: {
          id: domain.id,
          fullDomain: domain.fullDomain,
          verificationStatus: newStatus,
          lastCheckedAt: new Date(),
        },
        previousStatus,
        newStatus,
        pendingEmailsProcessed: false,
        message: newStatus === 'verified'
          ? 'Domain is connected and verified'
          : 'Domain is still disconnected. Please verify your DNS records.',
      })
    }

    // Domain reconnected - process pending emails
    console.log('Domain reconnected, processing pending emails...')

    const result = await processPendingEmails({
      domainId,
      aliasId: aliasId || null,
    })

    return NextResponse.json({
      domain: {
        id: domain.id,
        fullDomain: domain.fullDomain,
        verificationStatus: newStatus,
        lastCheckedAt: new Date(),
      },
      previousStatus,
      newStatus,
      pendingEmailsProcessed: true,
      processedCount: result.processedCount,
      failedCount: result.failedCount,
      message: `Domain reconnected! Processed ${result.processedCount} pending emails.`,
    })
  } catch (error) {
    console.error('Error rechecking domain:', error)
    return NextResponse.json(
      { error: 'Failed to recheck domain' },
      { status: 500 }
    )
  }
}

/**
 * Process pending emails for a domain (optionally filtered by alias)
 * STRICT RULES:
 * - Only processes emails with status='pending' and pending_reason='domain_disconnected'
 * - Re-validates alias exists and is active
 * - Processes in batches (50 emails max per request)
 * - Keeps S3 objects
 */
async function processPendingEmails({ domainId, aliasId }) {
  const BATCH_SIZE = 50

  // Query pending emails
  const whereClause = {
    domainId,
    status: 'pending',
    pendingReason: 'domain_disconnected',
  }

  if (aliasId) {
    whereClause.aliasId = aliasId
  }

  const pendingEmails = await prisma.emailLog.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'asc',
    },
    take: BATCH_SIZE,
    include: {
      alias: true,
      domain: true,
    },
  })

  console.log(`Processing ${pendingEmails.length} pending emails...`)

  let processedCount = 0
  let failedCount = 0

  for (const email of pendingEmails) {
    try {
      // Re-validate alias still exists and is active
      if (!email.alias) {
        console.log(`Alias not found for email ${email.id}, marking as failed`)
        await prisma.emailLog.update({
          where: { id: email.id },
          data: {
            status: 'failed',
            error: 'Alias no longer exists',
          },
        })
        failedCount++
        continue
      }

      if (!email.alias.isActive) {
        console.log(`Alias ${email.alias.id} is inactive, marking email as failed`)
        await prisma.emailLog.update({
          where: { id: email.id },
          data: {
            status: 'failed',
            error: 'Alias is inactive',
          },
        })
        failedCount++
        continue
      }

      // Fetch email from S3
      const rawEmailBuffer = await fetchEmailFromS3(email.s3Bucket, email.s3Key)
      const parsed = await simpleParser(rawEmailBuffer)

      // Extract original sender
      const fromText = parsed.from?.text || parsed.headers.get('from')
      const fromEmail = extractEmailAddress(fromText)

      // Forward email
      const aliasEmail = `${email.alias.localPart}@${email.domain.fullDomain}`
      await forwardEmail(rawEmailBuffer, email.alias.forwardTo, parsed, aliasEmail, fromEmail)

      // Update status to forwarded
      await prisma.emailLog.update({
        where: { id: email.id },
        data: {
          status: 'forwarded',
          error: null,
          pendingReason: null,
        },
      })

      console.log(`Successfully processed pending email ${email.id}`)
      processedCount++
    } catch (error) {
      console.error(`Failed to process pending email ${email.id}:`, error)

      // Mark as failed
      await prisma.emailLog.update({
        where: { id: email.id },
        data: {
          status: 'failed',
          error: `Failed to forward: ${error.message}`,
        },
      })

      failedCount++
    }
  }

  return {
    processedCount,
    failedCount,
    totalFound: pendingEmails.length,
  }
}

/**
 * Extract email address from string
 */
function extractEmailAddress(emailString) {
  if (!emailString) return null

  const match = emailString.match(/<(.+?)>/)
  if (match) {
    return match[1].trim()
  }

  return emailString.trim()
}

/**
 * Forward email with proper header rewriting
 */
async function forwardEmail(rawEmailBuffer, forwardTo, parsed, aliasEmail, originalFrom) {
  try {
    const rawEmailString = rawEmailBuffer.toString('utf-8')

    // Split headers and body
    const headerBodySplit = rawEmailString.split(/\r?\n\r?\n/)
    const originalHeaders = headerBodySplit[0]
    const body = headerBodySplit.slice(1).join('\r\n\r\n')

    // Parse existing headers
    const headerLines = originalHeaders.split(/\r?\n/)
    const preservedHeaders = []

    // Filter out problematic headers
    for (const line of headerLines) {
      const lowerLine = line.toLowerCase()

      if (
        lowerLine.startsWith('from:') ||
        lowerLine.startsWith('to:') ||
        lowerLine.startsWith('return-path:') ||
        lowerLine.startsWith('sender:') ||
        lowerLine.startsWith('reply-to:') ||
        lowerLine.startsWith('dkim-signature:') ||
        lowerLine.startsWith('x-melme-')
      ) {
        continue
      }

      preservedHeaders.push(line)
    }

    // Build new headers
    const newHeaders = [
      `From: ${aliasEmail}`,
      `To: ${forwardTo}`,
      `Reply-To: ${originalFrom}`,
      `X-MelMe-Forwarded: true`,
      `X-MelMe-Original-From: ${originalFrom}`,
      `X-MelMe-Processed-From-Pending: true`,
      ...preservedHeaders,
    ]

    // Reconstruct email
    const completeEmail = newHeaders.join('\r\n') + '\r\n\r\n' + body

    // Send via SES
    const command = new SendRawEmailCommand({
      Source: aliasEmail,
      Destinations: [forwardTo],
      RawMessage: {
        Data: Buffer.from(completeEmail),
      },
    })

    console.log(`Forwarding pending email FROM: ${aliasEmail} TO: ${forwardTo} REPLY-TO: ${originalFrom}`)
    await sesClient.send(command)
  } catch (error) {
    console.error('SES forward error:', error)
    throw new Error(`Failed to forward email: ${error.message}`)
  }
}
