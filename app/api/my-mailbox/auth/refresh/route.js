import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getValidatedMailboxSession } from '@/lib/mailboxAuth'
import prisma from '@/lib/prisma'

/**
 * POST /api/my-mailbox/auth/refresh
 * Extends the current mailbox session by 1 hour and returns the same token.
 * Called by the mobile app's API client when the token is close to expiry.
 */
export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const mailboxSession = await getValidatedMailboxSession(req, cookieStore)

    if (!mailboxSession) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    // Extend session by 1 hour
    const newExpiry = new Date(Date.now() + 60 * 60 * 1000)
    await prisma.mailboxSession.update({
      where: { id: mailboxSession.id },
      data: { expiresAt: newExpiry },
    })

    // Refresh the cookie too (for web)
    cookieStore.set('melme_mailbox_session', mailboxSession.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60,
      path: '/',
    })

    return NextResponse.json({
      // Return the same session ID as the access token
      accessToken: mailboxSession.id,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('Error refreshing mailbox session:', error)
    return NextResponse.json({ error: 'Failed to refresh session' }, { status: 500 })
  }
}
