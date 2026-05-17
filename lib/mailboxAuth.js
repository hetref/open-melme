import { validateMailboxSession } from './mailbox'

/**
 * Extract the session ID from a Next.js request.
 * Accepts:
 *  1. Authorization: Bearer <sessionId>  (used by React Native app)
 *  2. melme_mailbox_session cookie        (used by web browser)
 *
 * @param {Request} request - Next.js request object
 * @param {import('next/headers').ReadonlyRequestCookies} cookieStore - Awaited cookies() store
 * @returns {string|null} sessionId or null
 */
export function extractSessionId(request, cookieStore) {
  // 1. Bearer token takes priority (React Native)
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token) return token
  }

  // 2. Fall back to cookie (web browser)
  return cookieStore?.get('melme_mailbox_session')?.value ?? null
}

/**
 * Validate a mailbox session from either Bearer token or cookie.
 * Returns the validated session object, or null if invalid/missing.
 *
 * @param {Request} request
 * @param {import('next/headers').ReadonlyRequestCookies} cookieStore
 * @returns {Promise<Object|null>}
 */
export async function getValidatedMailboxSession(request, cookieStore) {
  const sessionId = extractSessionId(request, cookieStore)
  if (!sessionId) return null
  return validateMailboxSession(sessionId)
}
