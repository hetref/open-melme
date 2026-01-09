import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

/**
 * Fetch email content from S3
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>} - Raw email content
 */
export async function fetchEmailFromS3(bucket, key) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const response = await s3Client.send(command)

    // Convert stream to buffer
    const chunks = []
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  } catch (error) {
    console.error('Error fetching email from S3:', error)
    throw new Error(`Failed to fetch email from S3: ${error.message}`)
  }
}

/**
 * Generate presigned URL for email access
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration in seconds (default: 3600)
 * @returns {Promise<string>} - Presigned URL
 */
export async function generatePresignedUrl(bucket, key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    })

    return presignedUrl
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw new Error(`Failed to generate presigned URL: ${error.message}`)
  }
}

/**
 * Generate presigned URL for attachment download
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @param {string} filename - Filename for download
 * @param {number} expiresIn - URL expiration in seconds (default: 60)
 * @returns {Promise<string>} - Presigned download URL
 */
export async function generatePresignedDownloadUrl(bucket, key, filename, expiresIn = 60) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    })

    return presignedUrl
  } catch (error) {
    console.error('Error generating presigned download URL:', error)
    throw new Error(`Failed to generate presigned download URL: ${error.message}`)
  }
}

/**
 * Delete email from S3 (for invalid emails)
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteEmailFromS3(bucket, key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    await s3Client.send(command)
    console.log(`Deleted S3 object: ${bucket}/${key}`)
    return true
  } catch (error) {
    console.error('Error deleting email from S3:', error)
    throw new Error(`Failed to delete email from S3: ${error.message}`)
  }
}

/**
 * Upload attachment to S3
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @param {Buffer} content - Attachment content
 * @param {string} contentType - MIME type
 * @returns {Promise<boolean>} - Success status
 */
export async function uploadAttachmentToS3(bucket, key, content, contentType) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: contentType,
    })

    await s3Client.send(command)
    console.log(`Uploaded attachment to S3: ${bucket}/${key}`)
    return true
  } catch (error) {
    console.error('Error uploading attachment to S3:', error)
    throw new Error(`Failed to upload attachment to S3: ${error.message}`)
  }
}

/**
 * Sanitize filename for S3 storage
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
  // Remove or replace dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace non-alphanumeric chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .slice(0, 200) // Limit length
}
