// lib/auth-cookie.ts
//
// Helpers for reading/writing the JWT cookie. httpOnly so client JS
// can't access it (XSS protection). secure in production. sameSite
// lax so cookies still work after a same-site redirect.
//
// Server-only. Call from Route Handlers and Server Components.

import { cookies } from 'next/headers'

const COOKIE_NAME = 'klassrun_auth'
const ONE_WEEK    = 60 * 60 * 24 * 7

export async function setAuthCookie(token: string, maxAgeSeconds = ONE_WEEK) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  })
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export const AUTH_COOKIE_NAME = COOKIE_NAME
