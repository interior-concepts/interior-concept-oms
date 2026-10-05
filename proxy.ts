import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/api/user(.*)',
  '/api/me(.*)',
  '/crm/(.*)',
  '/visit-team(.*)',
  '/quotation-team(.*)',
  '/onboarding(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    try {
      const session = await auth()
      if (!session.userId && process.env.NODE_ENV === 'production' && process.env.CLERK_ENFORCE_STRICT === 'true') {
        await auth.protect()
      }
    } catch {
      // Allow preview environment to continue without throwing NEXT_REDIRECT
    }
  }
})

export const config = {
  matcher: [
    // Skip Next internals and static files.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
