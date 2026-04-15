import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/mailbox";
import prisma from "@/lib/prisma";

function parseAliasEmail(aliasEmail) {
  if (typeof aliasEmail !== "string") {
    return null;
  }

  const normalized = aliasEmail.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return null;
  }

  return {
    email: normalized,
    localPart: normalized.slice(0, atIndex),
    domain: normalized.slice(atIndex + 1),
  };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function resolveMailboxAlias(parsedAlias) {
  return prisma.alias.findFirst({
    where: {
      localPart: parsedAlias.localPart,
      mode: "mailbox",
      mailboxId: {
        not: null,
      },
      domain: {
        fullDomain: {
          equals: parsedAlias.domain,
          mode: "insensitive",
        },
      },
    },
    select: {
      id: true,
      mailboxId: true,
    },
  });
}

export async function POST(req) {
  try {
    const { aliasEmail, token, newPassword } = await req.json();

    if (!aliasEmail || !token || !newPassword) {
      return NextResponse.json(
        { error: "Alias email, token, and new password are required" },
        { status: 400 },
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    const parsedAlias = parseAliasEmail(aliasEmail);
    if (!parsedAlias) {
      return NextResponse.json(
        { error: "Alias email is invalid" },
        { status: 400 },
      );
    }

    const alias = await resolveMailboxAlias(parsedAlias);
    if (!alias?.mailboxId) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const identifier = `mailbox-reset:${alias.id}`;
    const tokenHash = hashToken(token);

    const verification = await prisma.verification.findFirst({
      where: {
        identifier,
        value: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        expiresAt: "desc",
      },
      select: {
        id: true,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.mailbox.update({
        where: {
          id: alias.mailboxId,
        },
        data: {
          passwordHash,
        },
      }),
      prisma.mailboxSession.updateMany({
        where: {
          mailboxId: alias.mailboxId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
      prisma.verification.deleteMany({
        where: {
          identifier,
        },
      }),
    ]);

    return NextResponse.json({
      message:
        "Mailbox password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Error resetting mailbox password:", error);
    return NextResponse.json(
      { error: "Failed to reset mailbox password" },
      { status: 500 },
    );
  }
}
