import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import prisma from './prisma'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

/**
 * Bulk delete aliases with all related S3 and DB data
 * PERFORMANCE-CRITICAL: Uses batch operations
 * 
 * @param {string[]} aliasIds - Array of alias IDs to delete
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} - Deletion results
 */
export async function bulkDeleteAliases(aliasIds, userId) {
  const results = {
    success: [],
    failed: [],
    s3Stats: {
      objectsDeleted: 0,
      errors: [],
    },
  }

  if (!aliasIds || aliasIds.length === 0) {
    return results
  }

  try {
    // Step 1: Verify all aliases belong to the user
    const aliases = await prisma.alias.findMany({
      where: {
        id: { in: aliasIds },
        userId,
      },
      select: {
        id: true,
        localPart: true,
      },
    })

    if (aliases.length !== aliasIds.length) {
      throw new Error('Some aliases not found or do not belong to user')
    }

    // Step 2: Get all email logs and their S3 keys for these aliases
    const emailLogs = await prisma.emailLog.findMany({
      where: {
        aliasId: { in: aliasIds },
      },
      select: {
        id: true,
        s3Bucket: true,
        s3Key: true,
        aliasId: true,
      },
    })

    // Step 3: Get all attachment records with their S3 keys
    const attachments = await prisma.emailAttachment.findMany({
      where: {
        emailLogId: { in: emailLogs.map(log => log.id) },
      },
      select: {
        id: true,
        s3Bucket: true,
        s3Key: true,
      },
    })

    // Step 4: Collect all S3 keys grouped by bucket
    const s3KeysByBucket = {}

    // Add email S3 keys
    for (const log of emailLogs) {
      if (log.s3Bucket && log.s3Key) {
        if (!s3KeysByBucket[log.s3Bucket]) {
          s3KeysByBucket[log.s3Bucket] = []
        }
        s3KeysByBucket[log.s3Bucket].push({ Key: log.s3Key })
      }
    }

    // Add attachment S3 keys
    for (const attachment of attachments) {
      if (attachment.s3Bucket && attachment.s3Key) {
        if (!s3KeysByBucket[attachment.s3Bucket]) {
          s3KeysByBucket[attachment.s3Bucket] = []
        }
        s3KeysByBucket[attachment.s3Bucket].push({ Key: attachment.s3Key })
      }
    }

    // Step 5: Delete S3 objects in batches (max 1000 per batch)
    for (const [bucket, keys] of Object.entries(s3KeysByBucket)) {
      if (keys.length === 0) continue

      try {
        // Split into batches of 1000 (S3 limit)
        for (let i = 0; i < keys.length; i += 1000) {
          const batch = keys.slice(i, i + 1000)

          const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: batch,
              Quiet: true, // Only return errors
            },
          })

          const deleteResponse = await s3Client.send(deleteCommand)

          results.s3Stats.objectsDeleted += batch.length - (deleteResponse.Errors?.length || 0)

          if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
            results.s3Stats.errors.push({
              bucket,
              errors: deleteResponse.Errors,
            })
          }
        }
      } catch (s3Error) {
        console.error(`Failed to delete S3 objects from bucket ${bucket}:`, s3Error)
        results.s3Stats.errors.push({
          bucket,
          error: s3Error.message,
        })
        // Continue with DB cleanup even if S3 fails
      }
    }

    // Step 6: Delete DB records in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Delete email attachments
        await tx.emailAttachment.deleteMany({
          where: {
            emailLogId: { in: emailLogs.map(log => log.id) },
          },
        })

        // Delete email logs
        await tx.emailLog.deleteMany({
          where: {
            aliasId: { in: aliasIds },
          },
        })

        // Delete aliases
        await tx.alias.deleteMany({
          where: {
            id: { in: aliasIds },
            userId, // Double-check authorization
          },
        })
      })

      results.success = aliasIds
    } catch (dbError) {
      console.error('Failed to delete DB records:', dbError)
      results.failed = aliasIds
      throw new Error(`DB deletion failed: ${dbError.message}`)
    }

    return results
  } catch (error) {
    console.error('Bulk delete aliases failed:', error)
    throw error
  }
}

/**
 * Delete a single alias with all related data
 * 
 * @param {string} aliasId - Alias ID to delete
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteAlias(aliasId, userId) {
  return bulkDeleteAliases([aliasId], userId)
}

/**
 * Get deletion preview - shows what will be deleted
 * 
 * @param {string[]} aliasIds - Array of alias IDs
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} - Preview data
 */
export async function getAliasDeletionPreview(aliasIds, userId) {
  // Verify aliases belong to user
  const aliases = await prisma.alias.findMany({
    where: {
      id: { in: aliasIds },
      userId,
    },
    include: {
      domain: {
        select: {
          fullDomain: true,
        },
      },
    },
  })

  if (aliases.length === 0) {
    throw new Error('No aliases found')
  }

  // Count related data
  const emailCount = await prisma.emailLog.count({
    where: {
      aliasId: { in: aliasIds },
    },
  })

  const emailLogs = await prisma.emailLog.findMany({
    where: {
      aliasId: { in: aliasIds },
    },
    select: {
      id: true,
    },
  })

  const attachmentCount = await prisma.emailAttachment.count({
    where: {
      emailLogId: { in: emailLogs.map(log => log.id) },
    },
  })

  return {
    aliases: aliases.map(alias => ({
      id: alias.id,
      email: `${alias.localPart}@${alias.domain.fullDomain}`,
      mode: alias.mode,
      isActive: alias.isActive,
    })),
    stats: {
      aliasCount: aliases.length,
      emailCount,
      attachmentCount,
    },
  }
}
