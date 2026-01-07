import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { deleteEmailIdentity } from '@/lib/ses'

/**
 * DELETE /api/domains/[domainId]
 * Delete a domain from database and AWS SES
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

    // Delete from database (cascades to aliases and logs)
    await prisma.domain.delete({
      where: {
        id: domainId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully',
    })

  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    )
  }
}
