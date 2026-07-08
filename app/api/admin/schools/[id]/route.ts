// app/api/admin/schools/[id]/route.ts
// superadmin-mvp — proxy for PATCH /api/admin/schools/:id (approve/suspend).
// Mirrors app/api/schools/me PATCH (apiFetch, result.ok, raw status) and the
// billing/verify dynamic-param pattern (await params, encodeURIComponent).

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }

  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: { message: 'Request body must be valid JSON' } },
      { status: 400 },
    )
  }

  const result = await apiFetch<unknown>(
    `/api/admin/schools/${encodeURIComponent(id)}`,
    { method: 'PATCH', token, body },
  )

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not update school' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}
