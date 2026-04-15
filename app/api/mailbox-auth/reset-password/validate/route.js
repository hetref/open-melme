import crypto from "node:crypto";
import { NextResponse } from "next/server";
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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const aliasEmail = searchParams.get("alias");
    const token = searchParams.get("token");

    if (!aliasEmail || !token) {
      return NextResponse.json(
        { error: "Invalid reset link" },
        { status: 400 },
      );
    }

    const parsedAlias = parseAliasEmail(aliasEmail);
    if (!parsedAlias) {
      return NextResponse.json(
        { error: "Invalid reset link" },
        { status: 400 },
      );
    }

    const alias = await prisma.alias.findFirst({
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
        localPart: true,
        domain: {
          select: {
            fullDomain: true,
          },
        },
      },
    });

    if (!alias) {
      return NextResponse.json(
        { error: "Invalid reset link" },
        { status: 400 },
      );
    }

    const tokenHash = hashToken(token);
    const identifier = `mailbox-reset:${alias.id}`;

    const verification = await prisma.verification.findFirst({
      where: {
        identifier,
        value: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        expiresAt: "desc",
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Invalid reset link" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      valid: true,
      aliasEmail: `${alias.localPart}@${alias.domain.fullDomain}`.toLowerCase(),
    });
  } catch (error) {
    console.error("Error validating mailbox reset token:", error);
    return NextResponse.json(
      { error: "Failed to validate reset link" },
      { status: 500 },
    );
  }
}
