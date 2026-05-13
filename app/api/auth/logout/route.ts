// app/api/auth/logout/route.ts
//
// Clears the auth cookie and redirects to the homepage.
//
// We use a 303 See Other redirect so the browser follows it as a GET
// (regardless of whether the form was submitted POST). That way the
// dashboard's <form action="/api/auth/logout" method="post"> ends up
// at GET / after submission.

import { NextResponse } from 'next/server'
import { clearAuthCookie, clearRoleCookie } from '@/lib/auth-cookie'

export async function POST(request: Request) {
  await clearAuthCookie()
  await clearRoleCookie()
  // Build absolute URL for the redirect (Next.js requires this in route handlers)
  const url = new URL('/', request.url)
  return NextResponse.redirect(url, 303)
}
