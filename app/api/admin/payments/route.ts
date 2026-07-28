// app/api/admin/payments/route.ts
// b2b-payments-v1 - proxy for GET /api/admin/payments (SUPER_ADMIN ledger).
// Mirrors app/api/admin/schools/[id]/route.ts conventions: getAuthCookie,
// apiFetch, result.ok, raw status pass-through. No dynamic segment, so no
// `await params` here - but query params are whitelisted, never forwarded raw.

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET(request: Request) {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }

  const incoming = new URL(request.url).searchParams
  const qs = new URLSearchParams()

  const schoolId = incoming.get('schoolId')
  if (schoolId && schoolId.trim()) qs.set('schoolId', schoolId.trim())

  // The API caps limit at 500 too; clamping here just avoids sending junk.
  const rawLimit = Number(incoming.get('limit'))
  if (Number.isFinite(rawLimit) && rawLimit > 0) {
    qs.set('limit', String(Math.min(Math.floor(rawLimit), 500)))
  }

  const suffix = qs.toString() ? '?' + qs.toString() : ''

  const result = await apiFetch<unknown>('/api/admin/payments' + suffix, { token })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not load payments' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}
