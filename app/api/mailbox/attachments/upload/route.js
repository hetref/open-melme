import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validateMailboxSession } from '@/lib/mailbox'
import { uploadAttachmentToS3, sanitizeFilename } from '@/lib/s3'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const S3_BUCKET = process.env.AWS_BUCKET_NAME

if (!S3_BUCKET) {
  console.error('CRITICAL: AWS_BUCKET_NAME environment variable is not set!')
}

// Max file size: 10MB per file
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Upload outbound email attachment to S3
 * POST /api/mailbox/attachments/upload
 * 
 * Body (multipart/form-data):
 * - file: File to upload
 * - uploadId: Temporary upload ID (generated client-side)
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

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file')
    const uploadId = formData.get('uploadId')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!uploadId) {
      return NextResponse.json(
        { error: 'uploadId is required' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    // Sanitize filename
    const originalFilename = file.name || 'attachment'
    const sanitizedFilenameStr = sanitizeFilename(originalFilename)

    if (!sanitizedFilenameStr) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique S3 key using uploadId (for outbound email attachments)
    const timestamp = Date.now()
    const randomStr = randomUUID().split('-')[0]
    const s3Key = `sent-attachments/${uploadId}/${timestamp}-${randomStr}-${sanitizedFilenameStr}`

    // Upload to S3
    await uploadAttachmentToS3(
      S3_BUCKET,
      s3Key,
      buffer,
      file.type || 'application/octet-stream'
    )

    return NextResponse.json({
      success: true,
      attachment: {
        s3Key,
        filename: sanitizedFilenameStr,
        originalFilename,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      },
    })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload attachment' },
      { status: 500 }
    )
  }
}
