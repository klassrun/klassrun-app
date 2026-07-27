// app/api/admin/schools/[id]/subscription/route.ts
// b2-admin-subscription-proxy
//
// Proxy for PATCH /api/admin/schools/:id/subscription (super-admin manual
// extension). Byte-for-byte the sibling of ../route.ts's PATCH: same
// await params, encodeURIComponent, apiFetch, result.ok, raw status
// pass-through. Forwards { plan?, extendDays, note } untouched - the API owns
// all validation and the never-shrink maths.

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
    `/api/admin/schools/${encodeURIComponent(id)}/subscription`,
    { method: 'PATCH', token, body },
  )

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not extend subscription' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}
