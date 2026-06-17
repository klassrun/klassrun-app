// app/api/portal/logout/route.ts
// ops-5c-portal-logout-route
import { NextResponse } from 'next/server'
import { clearPortalCookie } from '@/lib/auth-cookie'

export async function POST(request: Request) {
  await clearPortalCookie()
  // Only allow same-app portal redirects (open-redirect guard); else go home.
  const next = new URL(request.url).searchParams.get('next')
  const dest = next && next.startsWith('/portal/') ? next : '/'
  return NextResponse.redirect(new URL(dest, request.url), 303)
}
