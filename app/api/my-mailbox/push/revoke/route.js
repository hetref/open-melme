import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getValidatedMailboxSession } from '@/lib/mailboxAuth'

export async function DELETE(request) {
    try {
        const cookieStore = await cookies()
        const mailboxSession = await getValidatedMailboxSession(request, cookieStore)

        if (!mailboxSession) {
            return NextResponse.json({ error: 'Invalid or expired mailbox session' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const { expoPushToken } = body

        if (!expoPushToken) {
            return NextResponse.json({ error: 'expoPushToken is required' }, { status: 400 })
        }

        await prisma.mailboxPushToken.deleteMany({
            where: {
                expoPushToken,
                mailboxId: mailboxSession.mailbox.id,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error revoking mailbox push token:', error)
        return NextResponse.json({ error: 'Failed to revoke push token' }, { status: 500 })
    }
}
