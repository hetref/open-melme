import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
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
