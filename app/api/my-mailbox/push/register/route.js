import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getValidatedMailboxSession } from '@/lib/mailboxAuth'

export async function POST(request) {
    try {
        const cookieStore = await cookies()
        const mailboxSession = await getValidatedMailboxSession(request, cookieStore)

        if (!mailboxSession) {
            return NextResponse.json({ error: 'Invalid or expired mailbox session' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const { expoPushToken, deviceId, platform } = body

        if (!expoPushToken) {
            return NextResponse.json({ error: 'expoPushToken is required' }, { status: 400 })
        }

        const token = await prisma.mailboxPushToken.upsert({
            where: { expoPushToken },
            create: {
                expoPushToken,
                deviceId: deviceId || null,
                platform: platform || null,
                mailboxId: mailboxSession.mailbox.id,
                userId: mailboxSession.userId,
            },
            update: {
                deviceId: deviceId || null,
                platform: platform || null,
                // Re-bind the token to the current mailbox/user in case the device re-logged in
                mailboxId: mailboxSession.mailbox.id,
                userId: mailboxSession.userId,
            },
        })

        return NextResponse.json({ success: true, tokenId: token.id })
    } catch (error) {
        console.error('Error registering mailbox push token:', error)
        return NextResponse.json({ error: 'Failed to register push token' }, { status: 500 })
    }
}
