import { simpleParser } from "mailparser";
import prisma from "@/lib/prisma";
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses'
import { fetchEmailFromS3, deleteEmailFromS3 } from '@/lib/s3'
import { resolveConversationId } from '@/lib/email'
import { verifyDomainConnection } from '@/lib/ses'

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export async function GET() {
  const data = { message: "Receiver API is working!" }

  return Response.json({ data })
}

export async function POST(req) {
  try {
    // ==================== AUTHENTICATION ====================
    const secret = req.headers.get("x-internal-secret");
    if (!secret || secret !== process.env.PLATFORM_API_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ==================== PARSE PAYLOAD ====================
    const body = await req.json();
    const { s3 } = body;

    if (!s3?.bucket || !s3?.key) {
      return Response.json(
        { error: "Invalid payload - s3 bucket and key required" },
        { status: 400 }
      );
    }

    // ==================== IDEMPOTENCY CHECK ====================
    const existingLog = await prisma.emailLog.findUnique({
      where: { s3Key: s3.key },
    });

    if (existingLog) {
      console.log('Email already processed:', s3.key);
      return Response.json({
        received: true,
        status: 'already_processed',
        emailId: existingLog.id,
      });
    }

    // ==================== FETCH EMAIL FROM S3 ====================
    let rawEmailBuffer;
    try {
      rawEmailBuffer = await fetchEmailFromS3(s3.bucket, s3.key);
    } catch (s3Error) {
      console.error('Failed to fetch email from S3:', s3Error);
      // Silently fail - can't process without email content
      return Response.json({ received: true, ignored: 'fetch_failed' });
    }

    // ==================== PARSE EMAIL ====================
    let parsed;
    try {
      parsed = await simpleParser(rawEmailBuffer);
    } catch (parseError) {
      console.error('Failed to parse email:', parseError);
      // Delete malformed email
      await safeDeleteS3(s3.bucket, s3.key);
      return Response.json({ received: true, ignored: 'parse_failed' });
    }

    // Check for forwarding loop
    if (parsed.headers.get('x-melme-forwarded')) {
      console.log('Forwarding loop detected, dropping email');
      await safeDeleteS3(s3.bucket, s3.key);
      return Response.json({ received: true, ignored: 'forwarding_loop' });
    }

    // ==================== STEP 1: EXTRACT RECIPIENT EMAIL ====================
    const toText = parsed.to?.text || parsed.headers.get('to');
    const fromText = parsed.from?.text || parsed.headers.get('from');

    const toEmail = extractEmailAddress(toText);
    const fromEmail = extractEmailAddress(fromText);
    const subject = parsed.subject || '(No Subject)';

    if (!toEmail || !toEmail.includes('@')) {
      console.log('Invalid TO address format');
      await safeDeleteS3(s3.bucket, s3.key);
      return Response.json({ received: true, ignored: 'invalid_to_address' });
    }

    const [localPart, domain] = toEmail.toLowerCase().split('@');

    if (!domain || !localPart) {
      console.log('Could not parse localPart and domain');
      await safeDeleteS3(s3.bucket, s3.key);
      return Response.json({ received: true, ignored: 'invalid_email_format' });
    }

    // ==================== STEP 2: VALIDATE DOMAIN EXISTS ====================
    const domainRecord = await prisma.domain.findFirst({
      where: { fullDomain: domain },
    });

    if (!domainRecord) {
      console.log('Domain not found:', domain);
      await safeDeleteS3(s3.bucket, s3.key);
      return Response.json({ received: true, ignored: 'domain_not_found' });
    }

    // ==================== STEP 2.5: VERIFY DOMAIN CONNECTION ====================
    console.log('Verifying domain connection for:', domain);
    const connectionStatus = await verifyDomainConnection(domainRecord.fullDomain);

    // Update domain status in database (include MX status)
    await prisma.domain.update({
      where: { id: domainRecord.id },
      data: {
        verificationStatus: connectionStatus.verificationStatus,
        dkimStatus: connectionStatus.dkimStatus,
        mxStatus: connectionStatus.mxStatus,
        lastCheckedAt: new Date(),
      },
    }).catch(err => {
      console.error('Failed to update domain status (non-critical):', err.message);
    });

    // If domain is not connected, discard email
    if (!connectionStatus.isConnected) {
      console.log('Domain is not connected, discarding email:', domain);
      await safeDeleteS3(s3.bucket, s3.key);
      return Response.json({
        received: true,
        ignored: 'domain_not_connected',
        details: {
          verificationStatus: connectionStatus.verificationStatus,
          dkimStatus: connectionStatus.dkimStatus
        }
      });
    }

    console.log('Domain is connected and verified');

    // ==================== STEP 3: VALIDATE ALIAS EXISTS ====================
    const alias = await prisma.alias.findUnique({
      where: {
        domainId_localPart: {
          domainId: domainRecord.id,
          localPart: localPart,
        },
      },
      include: {
        mailbox: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!alias) {
      console.log('Alias not found:', localPart, '@', domain);
      await safeDeleteS3(s3.bucket, s3.key);
      return Response.json({ received: true, ignored: 'alias_not_found' });
    }

    // ==================== STEP 4: ALIAS ACTIVE CHECK ====================
    if (!alias.isActive) {
      console.log('Alias is inactive:', localPart, '@', domain);
      await safeDeleteS3(s3.bucket, s3.key);
      return Response.json({ received: true, ignored: 'alias_inactive' });
    }

    // ==================== EXTRACT THREADING HEADERS ====================
    const messageId = parsed.messageId || parsed.headers.get('message-id');
    const inReplyTo = parsed.inReplyTo || parsed.headers.get('in-reply-to');
    const referencesRaw = parsed.references || parsed.headers.get('references');
    const references = Array.isArray(referencesRaw)
      ? referencesRaw.join(' ')
      : referencesRaw;

    const conversationId = await resolveConversationId({
      messageId,
      inReplyTo,
      references,
    });

    // ==================== STEP 5: BRANCH BY ALIAS MODE ====================

    if (alias.mode === 'forward') {
      // ==================== CASE A: FORWARD ALIAS ====================

      if (!alias.forwardTo) {
        console.log('Forward mode but no forwardTo address configured');
        await safeDeleteS3(s3.bucket, s3.key);
        return Response.json({ received: true, ignored: 'no_forward_address' });
      }

      const aliasEmail = `${alias.localPart}@${domainRecord.fullDomain}`;

      // Try to forward
      try {
        await forwardEmail(rawEmailBuffer, alias.forwardTo, parsed, aliasEmail, fromEmail);

        // Log successful forward
        const emailLog = await safeLogEmail({
          userId: domainRecord.userId,
          domainId: domainRecord.id,
          aliasId: alias.id,
          fromEmail,
          toEmail: alias.forwardTo,
          subject,
          s3Bucket: s3.bucket,
          s3Key: s3.key,
          size: s3.size,
          status: 'forwarded',
          conversationId,
          messageId,
          inReplyTo,
          references,
        });

        // Delete S3 after successful forward
        await safeDeleteS3(s3.bucket, s3.key);

        console.log('Email forwarded successfully:', toEmail, '->', alias.forwardTo);

        return Response.json({
          received: true,
          status: 'forwarded',
          emailId: emailLog?.id,
          to: alias.forwardTo,
        });

      } catch (forwardError) {
        console.error('Failed to forward email:', forwardError);

        // Log failed forward - KEEP S3 for debugging
        const emailLog = await safeLogEmail({
          userId: domainRecord.userId,
          domainId: domainRecord.id,
          aliasId: alias.id,
          fromEmail,
          toEmail: alias.forwardTo,
          subject,
          s3Bucket: s3.bucket,
          s3Key: s3.key,
          size: s3.size,
          status: 'failed',
          error: forwardError.message,
          conversationId,
          messageId,
          inReplyTo,
          references,
        });

        return Response.json({
          received: true,
          status: 'failed',
          reason: 'forwarding_failed',
          emailId: emailLog?.id,
        });
      }
    }

    // ==================== CASE B: MAILBOX ALIAS ====================

    if (alias.mode === 'mailbox') {
      // Validate mailbox assignment
      if (!alias.mailboxId) {
        console.log('Mailbox alias has no assigned mailbox');
        await safeDeleteS3(s3.bucket, s3.key);
        return Response.json({ received: true, ignored: 'no_mailbox_assigned' });
      }

      // Check if mailbox is active
      if (!alias.mailbox || !alias.mailbox.isActive) {
        console.log('Mailbox is inactive or not found');
        await safeDeleteS3(s3.bucket, s3.key);
        return Response.json({ received: true, ignored: 'mailbox_inactive' });
      }

      // Store email - KEEP S3 for attachment processing
      const emailLog = await safeLogEmail({
        userId: domainRecord.userId,
        domainId: domainRecord.id,
        aliasId: alias.id,
        fromEmail,
        toEmail,
        subject,
        s3Bucket: s3.bucket,
        s3Key: s3.key,
        size: s3.size,
        status: 'received',
        conversationId,
        messageId,
        inReplyTo,
        references,
      });

      console.log(`[Receiver] Email stored in mailbox: ${toEmail} | emailId: ${emailLog?.id} | mailboxId: ${alias.mailboxId}`);

      const pushResult = await sendMailboxPushNotification({
        mailboxId: alias.mailboxId,
        emailId: emailLog?.id,
        conversationId: emailLog?.conversationId,
        fromEmail,
        subject,
      })

      // Log the push notification outcome so it's visible in server logs
      if (pushResult.tokenCount === 0) {
        console.log(`[Push] No registered tokens for mailboxId: ${alias.mailboxId} — notification not sent`);
      } else {
        console.log(`[Push] Sent to ${pushResult.tokenCount} token(s) for mailboxId: ${alias.mailboxId}`);
        console.log(`[Push] Tokens: ${pushResult.tokens.join(', ')}`);
        if (pushResult.error) {
          console.error(`[Push] Expo API error: ${pushResult.error}`);
        } else {
          console.log(`[Push] Expo API response: ${JSON.stringify(pushResult.expoResponse)}`);
        }
      }

      return Response.json({
        received: true,
        status: 'received',
        mode: 'mailbox',
        emailId: emailLog?.id,
        push: {
          tokenCount: pushResult.tokenCount,
          tokens: pushResult.tokens,
          sent: pushResult.tokenCount > 0 && !pushResult.error,
          error: pushResult.error ?? null,
          expoResponse: pushResult.expoResponse ?? null,
        },
      });
    }

    // Unknown mode - should never happen
    console.error('Unknown alias mode:', alias.mode);
    await safeDeleteS3(s3.bucket, s3.key);
    return Response.json({ received: true, ignored: 'unknown_mode' });

  } catch (err) {
    console.error("Receiver API critical error:", err);

    // Never crash - always return success to SES
    return Response.json({ received: true, ignored: 'internal_error' });
  }
}

async function sendMailboxPushNotification({ mailboxId, emailId, conversationId, fromEmail, subject }) {
  // Always return a result object — never throws
  const result = { tokenCount: 0, tokens: [], tickets: [], error: null, expoResponse: null }

  if (!mailboxId || !emailId) return result

  try {
    const rows = await prisma.mailboxPushToken.findMany({
      where: { mailboxId },
      select: { id: true, expoPushToken: true },
    })

    result.tokenCount = rows.length
    result.tokens = rows.map((r) => r.expoPushToken)

    if (!rows.length) return result

    const messageData = {
      title: fromEmail || 'New email',
      body: subject || 'You have a new email',
      data: {
        emailId,
        // conversationId lets the app navigate directly to the right thread
        conversationId: conversationId || emailId,
      },
      sound: 'default',
      channelId: 'mailbox',
    }

    // Send ONE request per token to avoid PUSH_TOO_MANY_EXPERIENCE_IDS.
    // Expo rejects batches that mix tokens from different Expo projects.
    const staleTokenIds = []

    for (const row of rows) {
      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ to: row.expoPushToken, ...messageData }]),
        })

        const json = await res.json().catch(() => null)

        // Top-level error (wrong project, malformed request, etc.)
        if (json?.errors?.length) {
          const errMsg = json.errors.map((e) => e.message).join('; ')
          console.error(`[Push] ❌ Token ${row.expoPushToken}: ${errMsg}`)
          result.tickets.push({ token: row.expoPushToken, status: 'error', message: errMsg })

          // Token belongs to a different Expo project — stale, remove it
          const isWrongProject = json.errors.some((e) => e.code === 'PUSH_TOO_MANY_EXPERIENCE_IDS')
          if (isWrongProject) staleTokenIds.push(row.id)
          continue
        }

        // Per-ticket error (DeviceNotRegistered, InvalidCredentials, etc.)
        const ticket = json?.data?.[0]
        if (ticket?.status === 'error') {
          console.error(`[Push] ❌ Token ${row.expoPushToken}: ${ticket.message} (${ticket.details?.error})`)
          result.tickets.push({ token: row.expoPushToken, status: 'error', message: ticket.message })
          if (ticket.details?.error === 'DeviceNotRegistered') {
            staleTokenIds.push(row.id)
          }
        } else {
          console.log(`[Push] ✅ Token ${row.expoPushToken}: sent (ticketId: ${ticket?.id})`)
          result.tickets.push({ token: row.expoPushToken, status: 'ok', id: ticket?.id })
        }
      } catch (tokenErr) {
        console.error(`[Push] ❌ Token ${row.expoPushToken}: fetch error: ${tokenErr?.message}`)
        result.tickets.push({ token: row.expoPushToken, status: 'error', message: tokenErr?.message })
      }
    }

    // Auto-clean stale tokens so they don't clog future sends
    if (staleTokenIds.length) {
      await prisma.mailboxPushToken.deleteMany({ where: { id: { in: staleTokenIds } } })
      console.log(`[Push] 🗑 Deleted ${staleTokenIds.length} stale/wrong-project token(s) from DB`)
    }

    result.expoResponse = result.tickets
    const failedCount = result.tickets.filter((t) => t.status === 'error').length
    if (failedCount) result.error = `${failedCount}/${result.tokenCount} token(s) failed`
  } catch (error) {
    result.error = error?.message || String(error)
    console.error('[Push] Failed to send mailbox push notification:', result.error)
  }

  return result
}

/**
 * Safe S3 delete - never throws
 */
async function safeDeleteS3(bucket, key) {
  try {
    await deleteEmailFromS3(bucket, key);
    console.log('S3 object deleted:', key);
  } catch (error) {
    console.error('S3 deletion failed (non-critical):', error.message);
    // Silently continue - S3 cleanup is best-effort
  }
}

/**
 * Safe email logging - never throws
 */
async function safeLogEmail({
  userId,
  domainId,
  aliasId,
  fromEmail,
  toEmail,
  subject,
  s3Bucket,
  s3Key,
  size,
  status,
  error = null,
  conversationId = null,
  messageId = null,
  inReplyTo = null,
  references = null,
}) {
  try {
    const emailLog = await prisma.emailLog.create({
      data: {
        userId,
        domainId,
        aliasId,
        fromEmail: fromEmail || 'unknown',
        toEmail: toEmail || 'unknown',
        subject: subject || '(No Subject)',
        s3Bucket,
        s3Key,
        size,
        status,
        error,
        conversationId,
        messageId,
        inReplyTo,
        references,
      },
    });

    return emailLog;
  } catch (logError) {
    console.error('Failed to log email (non-critical):', logError.message);
    return null;
  }
}

/**
 * Extract email address from string (handles "Name <email@domain.com>" format)
 */
function extractEmailAddress(emailString) {
  if (!emailString) return null;

  const match = emailString.match(/<(.+?)>/);
  if (match) {
    return match[1].trim();
  }

  return emailString.trim();
}

/**
 * Forward email with proper header rewriting
 * CRITICAL: FROM must be alias@domain (SES verified), Reply-To is original sender
 */
async function forwardEmail(rawEmailBuffer, forwardTo, parsed, aliasEmail, originalFrom) {
  const rawEmailString = rawEmailBuffer.toString('utf-8');

  // Split headers and body at first empty line
  const headerBodySplit = rawEmailString.split(/\r?\n\r?\n/);
  const originalHeaders = headerBodySplit[0];
  const body = headerBodySplit.slice(1).join('\r\n\r\n');

  // Parse existing headers line by line
  const headerLines = originalHeaders.split(/\r?\n/);
  const preservedHeaders = [];

  // Filter out headers that must be rewritten or removed
  for (const line of headerLines) {
    const lowerLine = line.toLowerCase();

    // Skip headers that we'll rewrite or that cause problems
    if (lowerLine.startsWith('from:') ||
      lowerLine.startsWith('to:') ||
      lowerLine.startsWith('return-path:') ||
      lowerLine.startsWith('sender:') ||
      lowerLine.startsWith('reply-to:') ||
      lowerLine.startsWith('dkim-signature:') ||
      lowerLine.startsWith('x-melme-')) {
      continue;
    }

    preservedHeaders.push(line);
  }

  // Build new headers in correct order
  const newHeaders = [
    `From: ${aliasEmail}`,
    `To: ${forwardTo}`,
    `Reply-To: ${originalFrom}`,
    `X-MelMe-Forwarded: true`,
    `X-MelMe-Original-From: ${originalFrom}`,
    ...preservedHeaders,
  ];

  // Reconstruct complete email
  const completeEmail = newHeaders.join('\r\n') + '\r\n\r\n' + body;

  // Send using SES SendRawEmail
  const command = new SendRawEmailCommand({
    Source: aliasEmail,
    Destinations: [forwardTo],
    RawMessage: {
      Data: Buffer.from(completeEmail),
    },
  });

  console.log(`Forwarding email FROM: ${aliasEmail} TO: ${forwardTo} REPLY-TO: ${originalFrom}`);
  await sesClient.send(command);
}
