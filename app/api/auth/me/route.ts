// app/api/auth/me/route.ts
//
// Returns the currently authenticated user. Used by client components
// after login to populate the dashboard, and by middleware to validate
// the cookie is still good.

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie, clearAuthCookie } from '@/lib/auth-cookie'

export async function GET() {
  const token = await getAuthCookie()

  if (!token) {
    return NextResponse.json(
      { error: { message: 'Not authenticated' } },
      { status: 401 },
    )
  }

  const result = await apiFetch('/api/auth/me', { token })

  if (!result.ok) {
    // Cookie is bad (expired/invalid) — clear it so the client doesn't loop
    if (result.status === 401) await clearAuthCookie()
    return NextResponse.json(
      { error: result.error ?? { message: 'Not authenticated' } },
      { status: result.status || 401 },
    )
  }

  return NextResponse.json(result.data)
}
