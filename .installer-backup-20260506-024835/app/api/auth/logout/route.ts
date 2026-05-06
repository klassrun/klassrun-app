// app/api/auth/logout/route.ts
//
// Clears the auth cookie. JWTs themselves can't be revoked server-side
// (without an allow-list, which we don't have), but clearing the cookie
// is enough — the client can't send what it doesn't have.

import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-cookie'

export async function POST() {
  await clearAuthCookie()
  return NextResponse.json({ message: 'Logged out' })
}
