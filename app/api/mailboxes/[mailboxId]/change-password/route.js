import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { verifyPassword, hashPassword } from '@/lib/mailbox'

// POST /api/mailboxes/[mailboxId]/change-password - Change mailbox password
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId } = await params
    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Verify mailbox ownership
    const mailbox = await prisma.mailbox.findUnique({
      where: {
        id: mailboxId,
        userId: session.user.id,
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, mailbox.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password and invalidate all sessions
    await prisma.$transaction([
      // Update password
      prisma.mailbox.update({
        where: {
          id: mailboxId,
        },
        data: {
          passwordHash: newPasswordHash,
        },
      }),
      // Delete all active sessions
      prisma.mailboxSession.deleteMany({
        where: {
          mailboxId: mailboxId,
        },
      }),
    ])

    return NextResponse.json({
      message: 'Password changed successfully. All sessions have been logged out.',
    })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
