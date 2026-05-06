// middleware.ts
//
// Route guard. Runs at the edge for every request matching the matcher below.
// Redirects unauthenticated users away from protected routes, and bounces
// already-authenticated users away from /login + /signup.

import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie'

const PROTECTED_PREFIXES = ['/dashboard', '/admin']
const AUTH_PAGES         = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasToken = !!request.cookies.get(AUTH_COOKIE_NAME)?.value

  // Unauthenticated user trying to reach a protected page → /login
  if (!hasToken && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
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
