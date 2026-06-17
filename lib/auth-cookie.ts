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


// ── Batch 2 Phase 1 — role cookie ──────────────────────────────────────────
// Non-httpOnly cookie used ONLY for client-side / middleware UI routing.
// The API still does real role checks on every request — this cookie is not
// security. If a user tampers with it, they'd see UI shells but no data.
export const ROLE_COOKIE_NAME = 'klassrun_role'

const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function setRoleCookie(role: string) {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  store.set(ROLE_COOKIE_NAME, role, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ROLE_COOKIE_MAX_AGE,
  })
}

export async function getRoleCookie(): Promise<string | undefined> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  return store.get(ROLE_COOKIE_NAME)?.value
}

export async function clearRoleCookie() {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  store.delete(ROLE_COOKIE_NAME)
}

// ── Operations 5c — portal cookie ──────────────────────────────────────────
// ops-5c-portal-cookie
// Separate httpOnly cookie for the parent/student portal. NEVER shared with the
// staff auth cookie — the two sessions are fully isolated.
export const PORTAL_COOKIE_NAME = 'klassrun_portal'

export async function setPortalCookie(token: string, maxAgeSeconds = ONE_WEEK) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: PORTAL_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  })
}

export async function getPortalCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(PORTAL_COOKIE_NAME)?.value ?? null
}

export async function clearPortalCookie() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: PORTAL_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

