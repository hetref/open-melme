import { randomUUID } from 'crypto'

/**
 * Sanitize email address for security
 * @param {string} email - Email address
 * @returns {string} - Sanitized email
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

/**
 * Validate email address format
 * @param {string} email - Email address
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize and validate email list
 * @param {string[]} emails - Array of email addresses
 * @returns {string[]} - Valid, sanitized, unique emails
 */
export function sanitizeEmailList(emails) {
  if (!Array.isArray(emails)) return []

  const sanitized = emails
    .map(sanitizeEmail)
    .filter(email => email && isValidEmail(email))

  // Remove duplicates
  return [...new Set(sanitized)]
}

/**
 * Generate RFC-compliant Message-ID
 * @param {string} domain - Domain to use in Message-ID
 * @returns {string}
 */
export function generateMessageId(domain) {
  const uuid = randomUUID()
  const timestamp = Date.now()
  return `<${uuid}.${timestamp}@${domain}>`
}

/**
 * Build email headers for MIME message
 * @param {Object} options
 * @returns {string}
 */
function buildHeaders({
  from,
  to,
  cc = [],
  bcc = [],
  subject,
  messageId,
  inReplyTo = null,
  references = null,
  date = new Date(),
}) {
  const headers = []

  // Basic headers
  headers.push(`From: ${from}`)
  headers.push(`To: ${to.join(', ')}`)

  if (cc.length > 0) {
    headers.push(`Cc: ${cc.join(', ')}`)
  }

  // BCC not included in headers (recipients added separately in SES)

  headers.push(`Subject: ${subject}`)
  headers.push(`Date: ${date.toUTCString()}`)
  headers.push(`Message-ID: ${messageId}`)

  // Threading headers for replies
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`)
  }

  if (references) {
    headers.push(`References: ${references}`)
  }

  // Standard headers
  headers.push('MIME-Version: 1.0')

  return headers.join('\r\n')
}

/**
 * Encode base64 content for MIME
 * @param {string|Buffer} content
 * @returns {string}
 */
function encodeBase64(content) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
  return buffer.toString('base64')
}

/**
 * Build multipart/alternative body (text only or text + html)
 * For text-only emails, skip the HTML part
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @param {string} boundary - MIME boundary
 * @returns {string}
 */
function buildAlternativeBody(text, html, boundary) {
  const parts = []

  // Plain text part (always included)
  parts.push(`--${boundary}`)
  parts.push('Content-Type: text/plain; charset=UTF-8')
  parts.push('Content-Transfer-Encoding: quoted-printable')
  parts.push('')
  parts.push(text || 'This email contains HTML content.')
  parts.push('')

  // HTML part (only if provided and not empty)
  if (html && html.trim()) {
    parts.push(`--${boundary}`)
    parts.push('Content-Type: text/html; charset=UTF-8')
    parts.push('Content-Transfer-Encoding: quoted-printable')
    parts.push('')
    parts.push(html)
    parts.push('')
  }

  parts.push(`--${boundary}--`)

  return parts.join('\r\n')
}

/**
 * Build attachment part
 * @param {Object} attachment
 * @param {string} boundary
 * @returns {string}
 */
function buildAttachmentPart(attachment, boundary) {
  const parts = []

  parts.push(`--${boundary}`)
  parts.push(`Content-Type: ${attachment.contentType}; name="${attachment.filename}"`)
  parts.push('Content-Transfer-Encoding: base64')
  parts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`)
  parts.push('')

  // Base64 encode content and wrap at 76 characters
  const base64 = encodeBase64(attachment.content)
  const wrapped = base64.match(/.{1,76}/g)?.join('\r\n') || base64
  parts.push(wrapped)
  parts.push('')

  return parts.join('\r\n')
}

/**
 * Build complete RAW MIME email
 * @param {Object} options
 * @param {string} options.from - From address (alias email)
 * @param {string[]} options.to - To addresses
 * @param {string[]} options.cc - CC addresses
 * @param {string[]} options.bcc - BCC addresses
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @param {Object[]} options.attachments - Array of {filename, contentType, content (Buffer)}
 * @param {string} options.replyToMessageId - Original Message-ID for threading
 * @param {string} options.domain - Sender domain
 * @returns {string} - Raw MIME message
 */
export function buildRawMimeEmail({
  from,
  to,
  cc = [],
  bcc = [],
  subject,
  text,
  html,
  attachments = [],
  replyToMessageId = null,
  domain,
}) {
  // Sanitize recipients
  const sanitizedTo = sanitizeEmailList(to)
  const sanitizedCc = sanitizeEmailList(cc)
  const sanitizedBcc = sanitizeEmailList(bcc)

  if (sanitizedTo.length === 0) {
    throw new Error('At least one valid recipient is required')
  }

  // Generate Message-ID
  const messageId = generateMessageId(domain)

  // Threading headers
  const threadingHeaders = {}
  if (replyToMessageId) {
    threadingHeaders.inReplyTo = replyToMessageId
    threadingHeaders.references = replyToMessageId
  }

  // Create boundaries
  const mixedBoundary = `----=_Part_${randomUUID().replace(/-/g, '')}`
  const altBoundary = `----=_Part_${randomUUID().replace(/-/g, '')}`

  const hasAttachments = attachments && attachments.length > 0
  const hasHtml = html && html.trim()

  // Build message based on content type
  const messageParts = []

  // Headers
  const headers = buildHeaders({
    from,
    to: sanitizedTo,
    cc: sanitizedCc,
    bcc: sanitizedBcc,
    subject,
    messageId,
    ...threadingHeaders,
  })

  messageParts.push(headers)

  if (hasAttachments) {
    // Multipart/mixed (for attachments)
    messageParts.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`)
    messageParts.push('')
    messageParts.push(`--${mixedBoundary}`)

    if (hasHtml) {
      // Need alternative boundary for text+html
      messageParts.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`)
      messageParts.push('')
      messageParts.push(buildAlternativeBody(text, html, altBoundary))
    } else {
      // Text only
      messageParts.push('Content-Type: text/plain; charset=UTF-8')
      messageParts.push('Content-Transfer-Encoding: quoted-printable')
      messageParts.push('')
      messageParts.push(text)
      messageParts.push('')
    }

    // Attachments
    for (const attachment of attachments) {
      messageParts.push(buildAttachmentPart(attachment, mixedBoundary))
    }

    messageParts.push(`--${mixedBoundary}--`)
  } else if (hasHtml) {
    // Multipart/alternative (text + html only)
    messageParts.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`)
    messageParts.push('')
    messageParts.push(buildAlternativeBody(text, html, altBoundary))
  } else {
    // Simple text-only email (no multipart needed)
    messageParts.push('Content-Type: text/plain; charset=UTF-8')
    messageParts.push('Content-Transfer-Encoding: quoted-printable')
    messageParts.push('')
    messageParts.push(text)
  }

  return messageParts.join('\r\n')
}

/**
 * Extract Message-ID from email headers
 * @param {Object} headers - Email headers object
 * @returns {string|null}
 */
export function extractMessageId(headers) {
  if (!headers) return null

  // Try different header formats
  const messageId = headers['message-id'] ||
    headers['Message-ID'] ||
    headers.messageId ||
    null

  return messageId
}

/**
 * Build "Re:" subject for replies
 * @param {string} originalSubject
 * @returns {string}
 */
export function buildReplySubject(originalSubject) {
  if (!originalSubject) return 'Re: (No Subject)'

  // Don't add Re: if already present
  if (originalSubject.toLowerCase().startsWith('re:')) {
    return originalSubject
  }

  return `Re: ${originalSubject}`
}

/**
 * Validate outbound email limits
 * @param {Object} options
 * @throws {Error} if validation fails
 */
export function validateEmailLimits({
  to = [],
  cc = [],
  bcc = [],
  subject = '',
  text = '',
  html = '',
  attachments = [],
}) {
  const totalRecipients = to.length + cc.length + bcc.length

  // Max recipients
  if (totalRecipients === 0) {
    throw new Error('At least one recipient is required')
  }

  if (totalRecipients > 50) {
    throw new Error('Maximum 50 recipients per email')
  }

  // Subject length
  if (subject && subject.length > 500) {
    throw new Error('Subject too long (max 500 characters)')
  }

  // Body size
  const textSize = Buffer.byteLength(text || '', 'utf8')
  const htmlSize = Buffer.byteLength(html || '', 'utf8')

  if (textSize > 1024 * 1024 * 2) { // 2MB
    throw new Error('Text body too large (max 2MB)')
  }

  if (htmlSize > 1024 * 1024 * 5) { // 5MB
    throw new Error('HTML body too large (max 5MB)')
  }

  // Attachments
  if (attachments.length > 10) {
    throw new Error('Maximum 10 attachments per email')
  }

  let totalAttachmentSize = 0
  for (const att of attachments) {
    totalAttachmentSize += att.content?.length || 0
  }

  if (totalAttachmentSize > 1024 * 1024 * 10) { // 10MB total
    throw new Error('Total attachment size exceeds 10MB')
  }

  // Empty email check
  if (!text && !html && attachments.length === 0) {
    throw new Error('Email must have content (text, HTML, or attachments)')
  }
}

/**
 * Sanitize HTML content for outbound emails
 * Basic XSS protection (client should handle most sanitization)
 * @param {string} html
 * @returns {string}
 */
export function sanitizeOutboundHtml(html) {
  if (!html) return ''

  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')

  return sanitized
}
