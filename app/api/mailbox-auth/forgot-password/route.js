import crypto from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import { sendMailboxPasswordResetEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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

function buildResetUrl(token, aliasEmail) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000";
  const encodedToken = encodeURIComponent(token);
  const encodedAlias = encodeURIComponent(aliasEmail);

  return `${baseUrl}/my-mailbox/reset-password?token=${encodedToken}&alias=${encodedAlias}`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req) {
  try {
    const { aliasEmail } = await req.json();
    const parsedAlias = parseAliasEmail(aliasEmail);

    // Generic response prevents alias enumeration.
    const genericResponse = NextResponse.json({
      message:
        "If the alias exists, a reset link has been sent to the connected personal email.",
    });

    if (!parsedAlias) {
      return genericResponse;
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
        personalEmail: true,
        domain: {
          select: {
            fullDomain: true,
          },
        },
        mailbox: {
          select: {
            isActive: true,
            personalEmail: true,
          },
        },
      },
    });

    if (!alias?.mailbox || !alias.mailbox.isActive) {
      return genericResponse;
    }

    const targetEmail = (
      alias.mailbox.personalEmail ||
      alias.personalEmail ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!isValidEmail(targetEmail)) {
      return genericResponse;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const identifier = `mailbox-reset:${alias.id}`;
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    const canonicalAliasEmail =
      `${alias.localPart}@${alias.domain.fullDomain}`.toLowerCase();

    await prisma.$transaction([
      prisma.verification.deleteMany({
        where: {
          identifier,
        },
      }),
      prisma.verification.create({
        data: {
          id: createId(),
          identifier,
          value: tokenHash,
          expiresAt,
        },
      }),
    ]);

    await sendMailboxPasswordResetEmail({
      to: targetEmail,
      aliasEmail: canonicalAliasEmail,
      resetUrl: buildResetUrl(rawToken, canonicalAliasEmail),
    });

    return genericResponse;
  } catch (error) {
    console.error("Error handling mailbox forgot password:", error);
    return NextResponse.json(
      { error: "Failed to process mailbox password reset request" },
      { status: 500 },
    );
  }
}
