import {
  SESv2Client,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  DeleteEmailIdentityCommand,
} from '@aws-sdk/client-sesv2'

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

/**
 * Create a new email identity in AWS SES and enable DKIM
 * @param {string} fullDomain - The complete domain (with subdomain if applicable)
 * @param {string} rootDomain - The root registrable domain
 * @param {string|null} subdomain - Optional subdomain
 */
export async function createEmailIdentity(fullDomain, rootDomain, subdomain) {
  try {
    // Create email identity (Easy DKIM is enabled by default)
    const createCommand = new CreateEmailIdentityCommand({
      EmailIdentity: fullDomain,
    })

    const createResponse = await sesClient.send(createCommand)

    // Get identity details including DKIM tokens
    const getCommand = new GetEmailIdentityCommand({
      EmailIdentity: fullDomain,
    })

    const identityDetails = await sesClient.send(getCommand)

    // Format DNS records based on subdomain presence
    const dnsRecords = {
      mx: {
        type: 'MX',
        host: subdomain || '@',
        value: `inbound-smtp.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com`,
        priority: 10,
      },
      dkim: [],
    }

    // Add DKIM records if available
    if (identityDetails.DkimAttributes?.Tokens) {
      dnsRecords.dkim = identityDetails.DkimAttributes.Tokens.map((token) => ({
        type: 'CNAME',
        host: `${token}._domainkey.${fullDomain}`,
        value: `${token}.dkim.amazonses.com`,
      }))
    }

    return {
      identityArn: createResponse.IdentityArn || identityDetails.IdentityArn,
      dnsRecords,
      verificationStatus: identityDetails.VerifiedForSendingStatus ? 'verified' : 'pending',
      dkimStatus: identityDetails.DkimAttributes?.Status || 'PENDING',
    }
  } catch (error) {
    console.error('Error creating email identity:', error)
    throw new Error(`Failed to create email identity: ${error.message}`)
  }
}

/**
 * Get email identity details from AWS SES
 * @param {string} fullDomain - The complete domain
 * @param {string|null} subdomain - Optional subdomain
 */
export async function getEmailIdentity(fullDomain, subdomain) {
  try {
    const command = new GetEmailIdentityCommand({
      EmailIdentity: fullDomain,
    })

    const response = await sesClient.send(command)

    const dnsRecords = {
      mx: {
        type: 'MX',
        host: subdomain || '@',
        value: `inbound-smtp.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com`,
        priority: 10,
      },
      dkim: [],
    }

    if (response.DkimAttributes?.Tokens) {
      dnsRecords.dkim = response.DkimAttributes.Tokens.map((token) => ({
        type: 'CNAME',
        host: `${token}._domainkey.${fullDomain}`,
        value: `${token}.dkim.amazonses.com`,
      }))
    }

    return {
      identityArn: response.IdentityArn,
      dnsRecords,
      verificationStatus: response.VerifiedForSendingStatus ? 'verified' : 'pending',
      dkimStatus: response.DkimAttributes?.Status || 'PENDING',
      dkimTokens: response.DkimAttributes?.Tokens || [],
    }
  } catch (error) {
    console.error('Error getting email identity:', error)
    throw new Error(`Failed to get email identity: ${error.message}`)
  }
}

/**
 * Delete email identity from AWS SES
 */
export async function deleteEmailIdentity(domain) {
  try {
    const command = new DeleteEmailIdentityCommand({
      EmailIdentity: domain,
    })

    await sesClient.send(command)
    return { success: true }
  } catch (error) {
    console.error('Error deleting email identity:', error)
    throw new Error(`Failed to delete email identity: ${error.message}`)
  }
}

/**
 * Verify domain by checking SES status and DNS records
 */
export async function verifyDomainStatus(domain) {
  try {
    const identity = await getEmailIdentity(domain)

    // Check DKIM status
    const dkimVerified = identity.dkimStatus === 'SUCCESS'

    // For MX record, we'll need to do DNS lookup
    // This is a simplified check - in production you'd use dns.resolve
    const mxVerified = identity.verificationStatus === 'verified'

    const missing = []
    const details = {}

    if (!dkimVerified) {
      missing.push('dkim')
      details.dkim = `DKIM status: ${identity.dkimStatus}`
    }

    if (!mxVerified) {
      missing.push('mx')
      details.mx = 'Domain not verified for sending'
    }

    const allVerified = missing.length === 0

    return {
      status: allVerified ? 'verified' : 'pending',
      dkimStatus: dkimVerified ? 'verified' : 'pending',
      mxStatus: mxVerified ? 'verified' : 'pending',
      missing,
      details,
      verificationError: allVerified ? null : 'Some DNS records are not configured correctly',
    }
  } catch (error) {
    console.error('Error verifying domain:', error)
    return {
      status: 'failed',
      dkimStatus: 'failed',
      mxStatus: 'failed',
      missing: ['mx', 'dkim'],
      details: {
        error: error.message,
      },
      verificationError: error.message,
    }
  }
}

/**
 * Verify domain connection by checking SES identity status
 * This function should be called on every inbound email to detect drift
 * @param {string} fullDomain - The complete domain
 * @returns {Promise<{isConnected: boolean, verificationStatus: string, dkimStatus: string}>}
 */
export async function verifyDomainConnection(fullDomain) {
  try {
    const command = new GetEmailIdentityCommand({
      EmailIdentity: fullDomain,
    })

    const response = await sesClient.send(command)

    // Check if domain is verified for sending
    const isVerified = response.VerifiedForSendingStatus === true
    const dkimStatus = response.DkimAttributes?.Status || 'PENDING'

    // Domain is connected only if verified for sending
    return {
      isConnected: isVerified,
      verificationStatus: isVerified ? 'verified' : 'pending',
      dkimStatus: dkimStatus === 'SUCCESS' ? 'verified' : 'pending',
    }
  } catch (error) {
    console.error('Error verifying domain connection:', error)

    // If identity not found or other error, domain is disconnected
    return {
      isConnected: false,
      verificationStatus: 'pending',
      dkimStatus: 'pending',
      error: error.message,
    }
  }
}

/**
 * Validate domain format
 */
export function isValidDomain(domain) {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i
  return domainRegex.test(domain)
}

/**
 * Validate subdomain format (no dots, alphanumeric + hyphen only)
 */
export function isValidSubdomain(subdomain) {
  if (!subdomain) return true // Optional field
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i
  return subdomainRegex.test(subdomain)
}

/**
 * Construct full domain from root and subdomain
 */
export function constructFullDomain(rootDomain, subdomain) {
  if (!subdomain || subdomain.trim() === '') {
    return rootDomain
  }
  return `${subdomain}.${rootDomain}`
}
