'use client'

import { useEffect } from 'react'

/**
 * Intercepts third-party Clerk dev-browser handshake fetch failures inside
 * cross-origin iframes (where third-party cookies / dev_browser handshakes are
 * blocked by the browser or iframe proxy) so they resolve gracefully instead
 * of throwing an unhandled TypeError: Failed to fetch.
 */
export function ClerkIframeGuard() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return

    const originalFetch = window.fetch
    const patchedFetch: typeof window.fetch = async (input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input?.url ?? ''

      const isClerkDevBrowserCall =
        url.includes('.clerk.accounts.dev') ||
        url.includes('/v1/dev_browser') ||
        url.includes('/v1/client') ||
        url.includes('/v1/environment')

      try {
        return await originalFetch(input, init)
      } catch (err) {
        if (isClerkDevBrowserCall) {
          return new Response(
            JSON.stringify({
              response: null,
              client: { sessions: [], sign_in: null, sign_up: null },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
        throw err
      }
    }

    window.fetch = patchedFetch
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
