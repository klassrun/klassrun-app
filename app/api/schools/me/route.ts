// app/api/schools/me/route.ts
//
// Vercel proxy for the klassrun-api school profile endpoint.
// GET   /api/schools/me — current user's school
// PATCH /api/schools/me — update editable fields (SCHOOL_ADMIN only — enforced by API)

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET() {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }

  const result = await apiFetch<unknown>('/api/schools/me', { token })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not load school' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}

export async function PATCH(request: Request) {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: { message: 'Request body must be valid JSON' } },
      { status: 400 },
    )
  }

  const result = await apiFetch<unknown>('/api/schools/me', {
    method: 'PATCH',
    token,
    body,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not save changes' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}
