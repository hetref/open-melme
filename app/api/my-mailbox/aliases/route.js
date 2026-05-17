import { NextResponse } from "next/server";
import { getValidatedMailboxSession } from "@/lib/mailboxAuth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req) {
  try {
    // Get and validate mailbox session (accepts Bearer token or cookie)
    const cookieStore = await cookies();
    const mailboxSession = await getValidatedMailboxSession(req, cookieStore);

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
