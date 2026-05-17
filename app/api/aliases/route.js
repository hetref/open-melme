import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyDomainConnection } from '@/lib/ses'
import { hashPassword } from '@/lib/mailbox'
import { sendAliasCreatedEmail, sendMailboxAccessEmail } from '@/lib/email'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized || !emailRegex.test(normalized)) {
    return null
  }

  return normalized
}

function sanitizeSlugPart(value) {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return sanitized || 'mailbox'
}

async function generateUniqueMailboxSlug(tx, baseValue) {
  const base = sanitizeSlugPart(baseValue).slice(0, 32)

  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 8)
    const candidate = `${base}-${suffix}`
    const existing = await tx.mailbox.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })

    if (!existing) {
      return candidate
    }
  }

  throw new Error('Failed to generate a unique mailbox identifier')
}

/**
 * GET /api/aliases
 * Get all domains with alias counts for the logged-in user
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const domains = await prisma.domain.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        aliases: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const domainsWithCounts = domains.map((domain) => ({
      id: domain.id,
      fullDomain: domain.fullDomain,
      rootDomain: domain.rootDomain,
      subdomain: domain.subdomain,
      verificationStatus: domain.verificationStatus,
      totalAliases: domain.aliases.length,
      activeAliases: domain.aliases.filter((a) => a.isActive).length,
      createdAt: domain.createdAt,
    }))

    return NextResponse.json({ domains: domainsWithCounts })
  } catch (error) {
    console.error('Error fetching aliases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch aliases' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/aliases
 * Create a new alias
 */
export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { domainId, localPart, mode, personalEmail, forwardTo, mailboxId, createMailbox } = body

    if (!domainId || !localPart || !mode || !personalEmail) {
      return NextResponse.json(
        { error: 'domainId, localPart, mode, and personalEmail are required' },
        { status: 400 }
      )
    }

    const normalizedPersonalEmail = normalizeEmail(personalEmail)
    if (!normalizedPersonalEmail) {
      return NextResponse.json(
        { error: 'Invalid personal email address' },
        { status: 400 }
      )
    }

    const normalizedOwnerEmail = normalizeEmail(session.user.email)
    if (!normalizedOwnerEmail) {
      return NextResponse.json(
        { error: 'Authenticated user email is missing or invalid' },
        { status: 400 }
      )
    }

    if (mode !== 'forward' && mode !== 'mailbox' && mode !== 'createMailbox') {
      return NextResponse.json(
        { error: 'Mode must be one of "forward", "mailbox", or "createMailbox"' },
        { status: 400 }
      )
    }

    const normalizedForwardTo = mode === 'forward'
      ? normalizeEmail(forwardTo || personalEmail)
      : null

    if (mode === 'forward' && !normalizedForwardTo) {
      return NextResponse.json(
        { error: 'Invalid forward to email address' },
        { status: 400 }
      )
    }

    let selectedMailbox = null
    if (mode === 'mailbox') {
      if (!mailboxId) {
        return NextResponse.json(
          { error: 'mailboxId is required for mailbox mode' },
          { status: 400 }
        )
      }

      selectedMailbox = await prisma.mailbox.findFirst({
        where: {
          id: mailboxId,
          userId: session.user.id,
          isActive: true,
        },
      })

      if (!selectedMailbox) {
        return NextResponse.json(
          { error: 'Mailbox not found or inactive' },
          { status: 404 }
        )
      }
    }

    let createMailboxInput = null
    if (mode === 'createMailbox') {
      if (!createMailbox || typeof createMailbox !== 'object') {
        return NextResponse.json(
          { error: 'createMailbox details are required for createMailbox mode' },
          { status: 400 }
        )
      }

      const {
        name,
        senderName,
        personalEmail: createMailboxPersonalEmail,
        password,
        confirmPassword,
      } = createMailbox

      if (!name || !senderName || !password || !confirmPassword) {
        return NextResponse.json(
          { error: 'Mailbox name, sender name, and passwords are required' },
          { status: 400 }
        )
      }

      const normalizedCreateMailboxEmail = normalizeEmail(createMailboxPersonalEmail)
      const mailboxPersonalEmail = normalizedCreateMailboxEmail || normalizedPersonalEmail

      if (!mailboxPersonalEmail) {
        return NextResponse.json(
          { error: 'Invalid personal email address' },
          { status: 400 }
        )
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: 'Mailbox passwords do not match' },
          { status: 400 }
        )
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Mailbox password must be at least 8 characters' },
          { status: 400 }
        )
      }

      createMailboxInput = {
        name: name.trim(),
        senderName: senderName.trim(),
        personalEmail: mailboxPersonalEmail,
        password,
      }

      if (!createMailboxInput.name) {
        return NextResponse.json(
          { error: 'Mailbox name cannot be empty' },
          { status: 400 }
        )
      }

      if (!createMailboxInput.senderName) {
        return NextResponse.json(
          { error: 'Sender name cannot be empty' },
          { status: 400 }
        )
      }
    }

    const cleanLocalPart = localPart.toLowerCase().trim()
    const localPartRegex = /^[a-z0-9._-]+$/

    if (!localPartRegex.test(cleanLocalPart)) {
      return NextResponse.json(
        { error: 'Local part must contain only lowercase letters, numbers, dots, hyphens, and underscores' },
        { status: 400 }
      )
    }

    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        userId: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    console.log('Checking domain connection status for:', domain.fullDomain)
    const connectionStatus = await verifyDomainConnection(domain.fullDomain)

    await prisma.domain.update({
      where: { id: domain.id },
      data: {
        verificationStatus: connectionStatus.verificationStatus,
        dkimStatus: connectionStatus.dkimStatus,
        lastCheckedAt: new Date(),
      },
    })

    if (!connectionStatus.isConnected) {
      return NextResponse.json(
        {
          error: 'Domain is not connected or verified. Please verify your DNS records before creating aliases.',
          details: connectionStatus.error || 'Domain verification failed',
        },
        { status: 400 }
      )
    }

    const existingAlias = await prisma.alias.findUnique({
      where: {
        domainId_localPart: {
          domainId,
          localPart: cleanLocalPart,
        },
      },
    })

    if (existingAlias) {
      return NextResponse.json(
        { error: 'Alias already exists for this domain' },
        { status: 400 }
      )
    }

    let alias = null
    let createdMailbox = null
    let notificationWarning = null

    if (mode === 'createMailbox') {
      const result = await prisma.$transaction(async (tx) => {
        const generatedSlug = await generateUniqueMailboxSlug(tx, cleanLocalPart)
        const passwordHash = await hashPassword(createMailboxInput.password)

        const mailbox = await tx.mailbox.create({
          data: {
            userId: session.user.id,
            name: createMailboxInput.name,
            slug: generatedSlug,
            senderName: createMailboxInput.senderName,
            personalEmail: createMailboxInput.personalEmail,
            passwordHash,
          },
        })

        const newAlias = await tx.alias.create({
          data: {
            userId: session.user.id,
            domainId,
            localPart: cleanLocalPart,
            personalEmail: normalizedOwnerEmail,
            mode: 'mailbox',
            forwardTo: null,
            mailboxId: mailbox.id,
            // Aliases created with inline mailbox setup are active immediately.
            isActive: true,
          },
        })

        return {
          mailbox,
          alias: newAlias,
        }
      })

      alias = result.alias
      createdMailbox = result.mailbox

      try {
        await sendMailboxAccessEmail({
          to: createdMailbox.personalEmail,
          mailboxName: createdMailbox.name,
          senderName: createdMailbox.senderName,
          mailboxEmail: `${alias.localPart}@${domain.fullDomain}`,
          accessUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/my-mailbox`,
        })
      } catch (emailError) {
        console.error('Error sending mailbox access email:', emailError)
        notificationWarning = 'Mailbox and alias were created, but access email could not be sent.'
      }
    } else {
      alias = await prisma.alias.create({
        data: {
          userId: session.user.id,
          domainId,
          localPart: cleanLocalPart,
          personalEmail: normalizedOwnerEmail,
          mode,
          forwardTo: mode === 'forward' ? normalizedForwardTo : null,
          mailboxId: mode === 'mailbox' ? mailboxId : null,
          // Existing behavior for manually selecting mailbox remains unchanged.
          isActive: mode === 'forward' ? true : false,
        },
      })
    }

    try {
      const mailboxUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/my-mailbox`
      await sendAliasCreatedEmail({
        to: normalizedPersonalEmail,
        aliasEmail: `${cleanLocalPart}@${domain.fullDomain}`,
        mode: mode === 'forward' ? 'forward' : 'mailbox',
        forwardTo: mode === 'forward' ? normalizedForwardTo : null,
        mailboxName: mode === 'mailbox'
          ? (selectedMailbox?.name || createdMailbox?.name)
          : null,
        mailboxUrl: mode === 'forward' ? null : mailboxUrl,
      })
    } catch (emailError) {
      console.error('Error sending alias created email:', emailError)
      notificationWarning = notificationWarning
        ? `${notificationWarning} Alias notification could not be sent.`
        : 'Alias was created, but notification email could not be sent.'
    }

    return NextResponse.json(
      {
        alias: {
          id: alias.id,
          localPart: alias.localPart,
          mode: alias.mode,
          personalEmail: alias.personalEmail,
          forwardTo: alias.forwardTo,
          mailboxId: alias.mailboxId,
          isActive: alias.isActive,
          createdAt: alias.createdAt,
        },
        warning: notificationWarning,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating alias:', error)
    return NextResponse.json(
      { error: 'Failed to create alias' },
      { status: 500 }
    )
  }
}