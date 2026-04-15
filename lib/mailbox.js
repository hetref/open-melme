import bcrypt from 'bcryptjs'
import prisma from './prisma'

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

/**
 * Create a mailbox session
 * @param {string} mailboxId - Mailbox ID
 * @param {string} userId - User ID
 * @param {string} userAgent - User agent string
 * @param {string} ipAddress - IP address
 * @returns {Promise<Object>} Created session
 */
export async function createMailboxSession(mailboxId, userId, userAgent, ipAddress) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour from now

  const session = await prisma.mailboxSession.create({
    data: {
      mailboxId,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    },
  })

  return session
}

/**
 * Validate a mailbox session
 * @param {string} sessionId - Session ID
 * @param {string} userId - Optional user ID making the request
 * @returns {Promise<Object|null>} Session with mailbox data if valid, null otherwise
 */
export async function validateMailboxSession(sessionId, userId) {
  if (!sessionId) {
    return null
  }

  const session = await prisma.mailboxSession.findUnique({
    where: { id: sessionId },
    include: {
      mailbox: {
        select: {
          id: true,
          name: true,
          slug: true,
          senderName: true,
          personalEmail: true,
          tags: true,
          description: true,
          isActive: true,
          aliases: {
            select: {
              id: true,
              localPart: true,
              personalEmail: true,
              isActive: true,
              domain: {
                select: {
                  fullDomain: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // Validate session exists
  if (!session) {
    return null
  }

  // Optional ownership check for routes that already know the account user.
  if (userId && session.userId !== userId) {
    return null
  }

  // Validate session is not revoked
  if (session.revokedAt) {
    return null
  }

  // Validate session is not expired
  if (new Date() > session.expiresAt) {
    return null
  }

  // Validate mailbox is active
  if (!session.mailbox.isActive) {
    return null
  }

  const assignedPersonalEmails = [...new Set(
    session.mailbox.aliases
      .map((alias) => alias.personalEmail)
      .filter(Boolean)
  )]

  session.mailbox.personalEmail =
    session.mailbox.personalEmail || assignedPersonalEmails[0] || null
  session.mailbox.assignedPersonalEmails = assignedPersonalEmails

  return session
}

/**
 * Revoke a mailbox session
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} True if revoked, false otherwise
 */
export async function revokeMailboxSession(sessionId) {
  try {
    await prisma.mailboxSession.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
      },
    })
    return true
  } catch (error) {
    console.error('Error revoking mailbox session:', error)
    return false
  }
}

/**
 * Cleanup expired mailbox sessions (can be run as a cron job)
 * @returns {Promise<number>} Number of sessions cleaned up
 */
export async function cleanupExpiredSessions() {
  const result = await prisma.mailboxSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
  return result.count
}
