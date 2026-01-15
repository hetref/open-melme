import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateMailboxSession } from "@/lib/mailbox";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get and validate mailbox session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("melme_mailbox_session")?.value;

    const mailboxSession = await validateMailboxSession(sessionId, session.user.id);

    if (!mailboxSession) {
      return NextResponse.json(
        { error: "Invalid or expired mailbox session" },
        { status: 401 }
      );
    }

    const mailboxId = mailboxSession.mailbox.id;

    // Fetch all aliases assigned to this mailbox
    const aliases = await prisma.alias.findMany({
      where: {
        mailboxId: mailboxId,
      },
      include: {
        domain: {
          select: {
            id: true,
            fullDomain: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ aliases });
  } catch (error) {
    console.error("Error fetching mailbox aliases:", error);
    return NextResponse.json(
      { error: "Failed to fetch aliases" },
      { status: 500 }
    );
  }
}
