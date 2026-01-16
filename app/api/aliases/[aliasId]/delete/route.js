import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getAliasPreDeleteCheck, transferAliasEmails, deleteAliasEmailsAndS3 } from '@/lib/alias-deletion'

/**
 * GET /api/aliases/[aliasId]/delete
 * Get pre-delete check information
 * Returns email counts, attachment counts, and available transfer targets
 */
export async function GET(request, { params }) {
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

    const { aliasId } = await params

    try {
      const preDeleteCheck = await getAliasPreDeleteCheck(aliasId, session.user.id)

      return NextResponse.json(preDeleteCheck)
    } catch (error) {
      console.error('Error getting pre-delete check:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to get deletion info' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error in pre-delete check:', error)
    return NextResponse.json(
      { error: 'Failed to check alias deletion status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/aliases/[aliasId]/delete
 * Execute alias deletion with specified action
 * Body: { action: 'transfer' | 'delete', targetAliasId?: string }
 */
export async function POST(request, { params }) {
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

    const { aliasId } = await params
    const body = await request.json()
    const { action, targetAliasId } = body

    // Validate action
    if (!action || !['transfer', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "transfer" or "delete"' },
        { status: 400 }
      )
    }

    if (action === 'transfer') {
      // Transfer emails to another alias
      if (!targetAliasId) {
        return NextResponse.json(
          { error: 'targetAliasId is required for transfer action' },
          { status: 400 }
        )
      }

      try {
        const result = await transferAliasEmails(aliasId, targetAliasId, session.user.id)

        return NextResponse.json({
          success: true,
          action: 'transfer',
          transferred: result.transferred,
          message: result.message,
        })
      } catch (error) {
        console.error('Error transferring emails:', error)
        return NextResponse.json(
          { error: error.message || 'Failed to transfer emails' },
          { status: 400 }
        )
      }
    }

    if (action === 'delete') {
      // Delete everything (emails, attachments, S3 objects)
      try {
        const result = await deleteAliasEmailsAndS3(aliasId, session.user.id)

        return NextResponse.json({
          success: true,
          action: 'delete',
          emailsDeleted: result.emailsDeleted,
          attachmentsDeleted: result.attachmentsDeleted,
          s3ObjectsDeleted: result.s3ObjectsDeleted,
          message: result.message,
        })
      } catch (error) {
        console.error('Error deleting alias and emails:', error)
        return NextResponse.json(
          { error: error.message || 'Failed to delete alias and emails' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in alias deletion:', error)
    return NextResponse.json(
      { error: 'Failed to process alias deletion' },
      { status: 500 }
    )
  }
}
