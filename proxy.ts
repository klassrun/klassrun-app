// proxy.ts
//
// Route guard. Runs at the edge for every request matching the matcher below.
// Redirects unauthenticated users away from protected routes, and bounces
// already-authenticated users away from /login + /signup.

// batch-2c-phase-4b-hotfix-proxy-export
import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME, ROLE_COOKIE_NAME, PORTAL_COOKIE_NAME } from '@/lib/auth-cookie'

const PROTECTED_PREFIXES = ['/dashboard', '/admin']
const AUTH_PAGES         = ['/login', '/signup']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ops-5c-portal-gate — portal is its own world (separate cookie); it never
  // touches the staff /dashboard or /admin logic below, and staff cookies grant
  // no portal access.
  if (pathname.startsWith('/portal/')) {
    const seg = pathname.split('/')        // ['', 'portal', slug, section, ...]
    const slug = seg[2] || ''
    const isPublic = seg[3] === 'login' || seg[3] === 'accept'
    const hasPortal = !!request.cookies.get(PORTAL_COOKIE_NAME)?.value
    if (slug && !isPublic && !hasPortal) {
      const url = request.nextUrl.clone()
      url.pathname = `/portal/${slug}/login`
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

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

    // ops-4c-fees-gate — fees reachable by SCHOOL_ADMIN and BURSAR
    if (
      pathname.startsWith('/dashboard/fees') &&
      role !== 'SCHOOL_ADMIN' &&
      role !== 'BURSAR'
    ) {
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
       pathname.startsWith('/dashboard/students') || // ops-1b-admin-gate
       pathname.startsWith('/dashboard/report-cards') ||
       pathname.startsWith('/dashboard/attendance') || // ops-2b-admin-gate
       pathname.startsWith('/dashboard/behaviour') || // ops-2b-admin-gate
       pathname.startsWith('/dashboard/promotions') || // ops-3-admin-gate
       // ops-4-admin-gate — fees moved to the dedicated ops-4c-fees-gate above (BURSAR access)
       pathname.startsWith('/dashboard/academic')) && // batch-2c-phase-1-academic-gate
      role !== 'SCHOOL_ADMIN'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // ops-1b-teacher-gate
    // /dashboard/results is TEACHER-only (admins generate/lock report cards instead)
    if (pathname.startsWith('/dashboard/results') && role !== 'TEACHER') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // batch-3-phase-1-lessons-gate
    // /dashboard/lessons is TEACHER-only (admins can view via API but not the UI)
    if (pathname.startsWith('/dashboard/lessons') && role !== 'TEACHER') {
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
    '/portal/:path*',
  ],
}
