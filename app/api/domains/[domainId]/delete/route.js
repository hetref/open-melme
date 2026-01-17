import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { deleteEmailIdentity } from '@/lib/ses'
import { deleteDomainWithAllData } from '@/lib/alias-deletion'

/**
 * DELETE /api/domains/[domainId]
 * Delete a domain from database and AWS SES with all related data
 * Efficiently removes all aliases, emails, and S3 objects in batches
 */
export async function DELETE(request, { params }) {
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

    const { domainId } = await params

    // Fetch domain to verify ownership and get fullDomain
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

    // Delete from AWS SES first
    try {
      await deleteEmailIdentity(domain.fullDomain)
    } catch (sesError) {
      console.error('SES deletion error:', sesError)
      // Continue with database deletion even if SES deletion fails
      // The identity might already be deleted or not exist
    }

    // Delete domain with all related data (aliases, emails, attachments, S3 objects)
    const deletionResults = await deleteDomainWithAllData(domainId, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Domain and all related data deleted successfully',
      stats: {
        aliasesDeleted: deletionResults.aliasesDeleted,
        emailsDeleted: deletionResults.emailsDeleted,
        attachmentsDeleted: deletionResults.attachmentsDeleted,
        s3ObjectsDeleted: deletionResults.s3ObjectsDeleted,
      },
      warnings: deletionResults.s3Errors.length > 0 ? {
        message: 'Some S3 objects may not have been deleted',
        details: deletionResults.s3Errors,
      } : null,
    })

  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete domain' },
      { status: 500 }
    )
  }
}
