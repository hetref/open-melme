import { simpleParser } from "mailparser";
import prisma from "@/lib/prisma";
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses'
import { fetchEmailFromS3 } from '@/lib/s3'

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
    // 1. Authenticate Lambda
    const secret = req.headers.get("x-internal-secret");
    if (!secret || secret !== process.env.PLATFORM_API_SECRET) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const body = await req.json();
    const { s3 } = body;

    if (!s3?.bucket || !s3?.key) {
      return Response.json(
        { error: "Invalid payload - s3 bucket and key required" },
        { status: 400 }
      );
    }

    // 3. IDEMPOTENCY CHECK - Critical to prevent duplicate forwarding
    const existingLog = await prisma.emailLog.findUnique({
      where: {
        s3Key: s3.key,
      },
    });

    if (existingLog) {
      console.log('Email already processed:', s3.key);
      return Response.json({
        received: true,
        status: 'already_processed',
        emailId: existingLog.id,
      });
    }

    // 4. Fetch email from S3
    let rawEmailBuffer;
    try {
      rawEmailBuffer = await fetchEmailFromS3(s3.bucket, s3.key);
    } catch (s3Error) {
      console.error('Failed to fetch email from S3:', s3Error);
      return Response.json(
        { error: 'Failed to fetch email from S3' },
        { status: 500 }
      );
    }

    // 5. Parse email (headers only for now)
    const parsed = await simpleParser(rawEmailBuffer);

    // Check for forwarding loop
    if (parsed.headers.get('x-melme-forwarded')) {
      console.log('Email already forwarded by MelMe, dropping to prevent loop');
      return Response.json({
        received: true,
        status: 'dropped',
        reason: 'forwarding_loop_prevention'
      });
    }

    // 6. Extract email addresses
    const toText = parsed.to?.text || parsed.headers.get('to');
    const fromText = parsed.from?.text || parsed.headers.get('from');

    const toEmail = extractEmailAddress(toText);
    const fromEmail = extractEmailAddress(fromText);
    const subject = parsed.subject || '(No Subject)';

    if (!toEmail) {
      console.error('Could not extract TO email address');
      return Response.json({ error: 'Invalid TO address' }, { status: 400 });
    }

    // 7. Parse domain and local part
    const [localPart, domain] = toEmail.toLowerCase().split('@');

    if (!domain || !localPart) {
      console.error('Invalid email format:', toEmail);
      return Response.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // 8. Find domain in database
    const domainRecord = await prisma.domain.findFirst({
      where: {
        fullDomain: domain,
        verificationStatus: 'verified',
      },
    });

    if (!domainRecord) {
      console.log('Domain not found or not verified:', domain);
      await logEmail({
        userId: null,
        domainId: null,
        aliasId: null,
        fromEmail,
        toEmail,
        subject,
        s3Bucket: s3.bucket,
        s3Key: s3.key,
        size: s3.size,
        status: 'failed',
        error: 'Domain not found or not verified',
      });
      return Response.json({
        received: true,
        status: 'rejected',
        reason: 'domain_not_found'
      });
    }

    // 9. Find alias
    const alias = await prisma.alias.findUnique({
      where: {
        domainId_localPart: {
          domainId: domainRecord.id,
          localPart: localPart,
        },
      },
    });

    if (!alias) {
      console.log('Alias not found:', localPart, '@', domain);
      await logEmail({
        userId: domainRecord.userId,
        domainId: domainRecord.id,
        aliasId: null,
        fromEmail,
        toEmail,
        subject,
        s3Bucket: s3.bucket,
        s3Key: s3.key,
        size: s3.size,
        status: 'failed',
        error: 'Alias not found',
      });
      return Response.json({
        received: true,
        status: 'rejected',
        reason: 'alias_not_found'
      });
    }

    // 10. Check if alias is active
    if (!alias.isActive) {
      console.log('Alias is inactive:', localPart, '@', domain);
      await logEmail({
        userId: domainRecord.userId,
        domainId: domainRecord.id,
        aliasId: alias.id,
        fromEmail,
        toEmail,
        subject,
        s3Bucket: s3.bucket,
        s3Key: s3.key,
        size: s3.size,
        status: 'failed',
        error: 'Alias inactive',
      });
      return Response.json({
        received: true,
        status: 'rejected',
        reason: 'alias_inactive'
      });
    }

    // 11. Log as received
    const emailLog = await logEmail({
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
      error: null,
    });

    // 12. Forward email
    try {
      const aliasEmail = `${alias.localPart}@${domainRecord.fullDomain}`;
      await forwardEmail(rawEmailBuffer, alias.forwardTo, parsed, aliasEmail, fromEmail);

      // Update status to forwarded
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'forwarded' },
      });

      console.log('Email forwarded successfully:', toEmail, '->', alias.forwardTo);

      return Response.json({
        received: true,
        status: 'forwarded',
        emailId: emailLog.id,
        to: alias.forwardTo
      });
    } catch (forwardError) {
      console.error('Error forwarding email:', forwardError);

      // Update status to failed
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'failed',
          error: forwardError.message,
        },
      });

      return Response.json({
        received: true,
        status: 'failed',
        reason: 'forwarding_failed',
        emailId: emailLog.id,
      });
    }

  } catch (err) {
    console.error("Inbound email API error:", err);

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
 * Log email to database
 */
async function logEmail({
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
  error,
}) {
  try {
    if (!userId || !domainId) {
      console.log('Skipping log - missing userId or domainId');
      return null;
    }

    const emailLog = await prisma.emailLog.create({
      data: {
        userId,
        domainId,
        aliasId,
        fromEmail: fromEmail || 'unknown',
        toEmail: toEmail || 'unknown',
        subject,
        s3Bucket,
        s3Key,
        size,
        status,
        error,
      },
    });

    return emailLog;
  } catch (err) {
    console.error('Error logging email:', err);
    return null;
  }
}

/** with proper header rewriting
 * CRITICAL: FROM must be alias@domain (SES verified), Reply-To is original sender
 */
async function forwardEmail(rawEmailBuffer, forwardTo, parsed, aliasEmail, originalFrom) {
  try {
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

    console.log(`Forwarded email FROM: ${aliasEmail} TO: ${forwardTo} REPLY-TO: ${originalFrom}`);
    await sesClient.send(command);
  } catch (error) {
    console.error('SES forward error:', error);
    throw new Error(`Failed to forward email: ${error.message}`);
  }
}