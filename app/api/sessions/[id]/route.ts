// app/api/sessions/[id]/route.ts
//
// PATCH dates on a specific session. SCHOOL_ADMIN enforced by API.
// batch-2c-phase-1-sessions-proxy

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
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
  const result = await apiFetch<unknown>(`/api/sessions/${encodeURIComponent(id)}`, {
    method: 'PATCH', token, body,
  })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not save changes' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}
