// proxy.ts
//
// Route guard. Runs at the edge for every request matching the matcher below.
// Redirects unauthenticated users away from protected routes, and bounces
// already-authenticated users away from /login + /signup.

// batch-2c-phase-4b-hotfix-proxy-export
import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME, ROLE_COOKIE_NAME } from '@/lib/auth-cookie'

const PROTECTED_PREFIXES = ['/dashboard', '/admin']
const AUTH_PAGES         = ['/login', '/signup']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasToken = !!request.cookies.get(AUTH_COOKIE_NAME)?.value

  // Unauthenticated user trying to reach a protected page → /login
  if (!hasToken && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // ── batch-2-phase-1-role-redirects ──
  // At this point, if the user has no token they've already been redirected.
  // So the role-cookie check below only runs for authenticated users.
  // The role cookie is NOT a security boundary — the API does real checks.
  // It exists purely for fast edge-time UI routing.
  if (hasToken) {
    const role = request.cookies.get(ROLE_COOKIE_NAME)?.value

    // /admin/* is SUPER_ADMIN only
    if (pathname.startsWith('/admin') && role !== 'SUPER_ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // /dashboard/teachers and /dashboard/settings are SCHOOL_ADMIN only
    if (
      (pathname.startsWith('/dashboard/teachers') ||
       pathname.startsWith('/dashboard/settings') ||
       pathname.startsWith('/dashboard/classes') || // batch-2c-phase-2-classes-gate
       pathname.startsWith('/dashboard/academic')) && // batch-2c-phase-1-academic-gate
      role !== 'SCHOOL_ADMIN'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  // Logged-in user visiting /login or /signup → /dashboard
  if (hasToken && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// IMPORTANT: matcher must catch BOTH /dashboard and /dashboard/anything.
// Previously '/dashboard/:path*' only caught /dashboard/foo, missing the
// bare /dashboard route.
export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/admin',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
}
