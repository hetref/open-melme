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
 * Transfer emails from one alias to another
 * Used when deleting a mailbox alias and want to preserve emails
 * 
 * @param {string} oldAliasId - Source alias ID
 * @param {string} newAliasId - Target alias ID
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} - Transfer result
 */
export async function transferAliasEmails(oldAliasId, newAliasId, userId) {
  try {
    // Step 1: Verify both aliases exist and belong to user
    const [oldAlias, newAlias] = await Promise.all([
      prisma.alias.findFirst({
        where: { id: oldAliasId, userId },
        include: { domain: true },
      }),
      prisma.alias.findFirst({
        where: { id: newAliasId, userId },
        include: { domain: true },
      }),
    ])

    if (!oldAlias) {
      throw new Error('Source alias not found')
    }

    if (!newAlias) {
      throw new Error('Target alias not found')
    }

    // Step 2: Validate transfer target
    if (newAlias.domainId !== oldAlias.domainId) {
      throw new Error('Target alias must be in the same domain')
    }

    if (newAlias.mode !== 'mailbox') {
      throw new Error('Target alias must be in mailbox mode')
    }

    if (!newAlias.isActive) {
      throw new Error('Target alias must be active')
    }

    // Step 3: Count emails to transfer
    const emailCount = await prisma.emailLog.count({
      where: { aliasId: oldAliasId },
    })

    if (emailCount === 0) {
      // No emails to transfer, just delete the alias
      await prisma.alias.delete({
        where: { id: oldAliasId },
      })

      return {
        success: true,
        transferred: 0,
        message: 'Alias deleted (no emails to transfer)',
      }
    }

    // Step 4: Transfer emails in a transaction
    await prisma.$transaction(async (tx) => {
      // Update all email logs to point to new alias
      await tx.emailLog.updateMany({
        where: { aliasId: oldAliasId },
        data: { aliasId: newAliasId },
      })

      // Delete the old alias
      await tx.alias.delete({
        where: { id: oldAliasId },
      })
    })

    return {
      success: true,
      transferred: emailCount,
      message: `Successfully transferred ${emailCount} emails`,
    }
  } catch (error) {
    console.error('Transfer alias emails failed:', error)
    throw error
  }
}

/**
 * Delete alias and all associated emails and S3 objects
 * This is a destructive operation that cannot be undone
 * 
 * @param {string} aliasId - Alias ID to delete
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteAliasEmailsAndS3(aliasId, userId) {
  try {
    // Step 1: Verify alias belongs to user
    const alias = await prisma.alias.findFirst({
      where: { id: aliasId, userId },
    })

    if (!alias) {
      throw new Error('Alias not found')
    }

    // Step 2: Get all email logs for this alias
    const emailLogs = await prisma.emailLog.findMany({
      where: { aliasId },
      select: {
        id: true,
        s3Bucket: true,
        s3Key: true,
      },
    })

    if (emailLogs.length === 0) {
      // No emails to delete, just delete the alias
      await prisma.alias.delete({
        where: { id: aliasId },
      })

      return {
        success: true,
        emailsDeleted: 0,
        attachmentsDeleted: 0,
        s3ObjectsDeleted: 0,
        message: 'Alias deleted (no emails found)',
      }
    }

    // Step 3: Get all attachments for these emails
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

    let totalS3Deleted = 0
    const s3Errors = []

    // Step 5: Delete S3 objects in batches
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
              Quiet: true,
            },
          })

          const deleteResponse = await s3Client.send(deleteCommand)
          totalS3Deleted += batch.length - (deleteResponse.Errors?.length || 0)

          if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
            s3Errors.push(...deleteResponse.Errors)
          }
        }
      } catch (s3Error) {
        console.error(`Failed to delete S3 objects from bucket ${bucket}:`, s3Error)
        s3Errors.push({ bucket, error: s3Error.message })
        // If S3 deletion fails, abort the operation
        throw new Error(`S3 deletion failed: ${s3Error.message}`)
      }
    }

    // Step 6: Delete database records in a transaction
    // Only proceed if S3 deletion was successful
    await prisma.$transaction(async (tx) => {
      // Delete email attachments
      await tx.emailAttachment.deleteMany({
        where: {
          emailLogId: { in: emailLogs.map(log => log.id) },
        },
      })

      // Delete email logs
      await tx.emailLog.deleteMany({
        where: { aliasId },
      })

      // Delete alias
      await tx.alias.delete({
        where: { id: aliasId },
      })
    })

    return {
      success: true,
      emailsDeleted: emailLogs.length,
      attachmentsDeleted: attachments.length,
      s3ObjectsDeleted: totalS3Deleted,
      s3Errors: s3Errors.length > 0 ? s3Errors : null,
      message: `Successfully deleted ${emailLogs.length} emails and ${attachments.length} attachments`,
    }
  } catch (error) {
    console.error('Delete alias emails and S3 failed:', error)
    throw error
  }
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

/**
 * Delete domain with all related data (aliases, emails, attachments, S3 objects)
 * PERFORMANCE-CRITICAL: Uses batch operations for efficient deletion
 * 
 * @param {string} domainId - Domain ID to delete
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} - Deletion results
 */
export async function deleteDomainWithAllData(domainId, userId) {
  const results = {
    success: false,
    aliasesDeleted: 0,
    emailsDeleted: 0,
    attachmentsDeleted: 0,
    s3ObjectsDeleted: 0,
    s3Errors: [],
  }

  try {
    // Step 1: Verify domain belongs to user
    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        userId,
      },
    })

    if (!domain) {
      throw new Error('Domain not found or access denied')
    }

    // Step 2: Get all aliases for this domain
    const aliases = await prisma.alias.findMany({
      where: {
        domainId,
      },
      select: {
        id: true,
      },
    })

    if (aliases.length === 0) {
      // No aliases, just delete the domain
      await prisma.domain.delete({
        where: { id: domainId },
      })

      results.success = true
      return results
    }

    const aliasIds = aliases.map(a => a.id)
    results.aliasesDeleted = aliasIds.length

    // Step 3: Get all email logs for these aliases
    const emailLogs = await prisma.emailLog.findMany({
      where: {
        aliasId: { in: aliasIds },
      },
      select: {
        id: true,
        s3Bucket: true,
        s3Key: true,
      },
    })

    results.emailsDeleted = emailLogs.length

    // Step 4: Get all attachments for these emails
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

    results.attachmentsDeleted = attachments.length

    // Step 5: Collect all S3 keys grouped by bucket
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

    // Step 6: Delete S3 objects in batches (max 1000 per batch)
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

          results.s3ObjectsDeleted += batch.length - (deleteResponse.Errors?.length || 0)

          if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
            results.s3Errors.push({
              bucket,
              errors: deleteResponse.Errors,
            })
          }
        }
      } catch (s3Error) {
        console.error(`Failed to delete S3 objects from bucket ${bucket}:`, s3Error)
        results.s3Errors.push({
          bucket,
          error: s3Error.message,
        })
        // Continue with DB cleanup even if S3 fails
      }
    }

    // Step 7: Delete DB records in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Delete email attachments
        if (emailLogs.length > 0) {
          await tx.emailAttachment.deleteMany({
            where: {
              emailLogId: { in: emailLogs.map(log => log.id) },
            },
          })
        }

        // Delete email logs
        await tx.emailLog.deleteMany({
          where: {
            aliasId: { in: aliasIds },
          },
        })

        // Delete aliases
        await tx.alias.deleteMany({
          where: {
            domainId,
          },
        })

        // Delete domain
        await tx.domain.delete({
          where: {
            id: domainId,
          },
        })
      })

      results.success = true
    } catch (dbError) {
      console.error('Failed to delete DB records:', dbError)
      throw new Error(`Database deletion failed: ${dbError.message}`)
    }

    return results
  } catch (error) {
    console.error('Delete domain with all data failed:', error)
    throw error
  }
}

/**
 * Get pre-delete check information for a single alias
 * Returns email counts and available transfer targets
 * 
 * @param {string} aliasId - Alias ID to check
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} - Pre-delete check data
 */
export async function getAliasPreDeleteCheck(aliasId, userId) {
  // Step 1: Verify alias belongs to user
  const alias = await prisma.alias.findFirst({
    where: { id: aliasId, userId },
    include: {
      domain: {
        select: {
          id: true,
          fullDomain: true,
        },
      },
    },
  })

  if (!alias) {
    throw new Error('Alias not found')
  }

  // Step 2: Count emails and attachments
  const emailLogs = await prisma.emailLog.findMany({
    where: { aliasId },
    select: {
      id: true,
      size: true,
    },
  })

  const emailCount = emailLogs.length
  const totalEmailSize = emailLogs.reduce((sum, log) => sum + (log.size || 0), 0)

  const attachments = await prisma.emailAttachment.findMany({
    where: {
      emailLogId: { in: emailLogs.map(log => log.id) },
    },
    select: {
      id: true,
      size: true,
    },
  })

  const attachmentCount = attachments.length
  const totalAttachmentSize = attachments.reduce((sum, att) => sum + att.size, 0)

  // Step 3: Get available transfer targets (only for mailbox mode)
  let transferTargets = []
  if (alias.mode === 'mailbox') {
    transferTargets = await prisma.alias.findMany({
      where: {
        domainId: alias.domainId,
        mode: 'mailbox',
        isActive: true,
        id: { not: aliasId }, // Exclude current alias
      },
      select: {
        id: true,
        localPart: true,
      },
      orderBy: {
        localPart: 'asc',
      },
    })
  }

  return {
    alias: {
      id: alias.id,
      localPart: alias.localPart,
      fullEmail: `${alias.localPart}@${alias.domain.fullDomain}`,
      mode: alias.mode,
      isActive: alias.isActive,
      domainId: alias.domainId,
      domainName: alias.domain.fullDomain,
    },
    stats: {
      emailCount,
      attachmentCount,
      totalEmailSize,
      totalAttachmentSize,
      totalSize: totalEmailSize + totalAttachmentSize,
    },
    transferTargets: transferTargets.map(target => ({
      id: target.id,
      localPart: target.localPart,
      fullEmail: `${target.localPart}@${alias.domain.fullDomain}`,
    })),
  }
}
