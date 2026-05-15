import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { emailNotifications, marketingEmails } = body ?? {}
  if (typeof emailNotifications !== "boolean" || typeof marketingEmails !== "boolean") {
    return NextResponse.json({ error: "Invalid preferences" }, { status: 400 })
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailNotifications,
        marketingEmails,
      },
      select: {
        emailNotifications: true,
        marketingEmails: true,
      },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
