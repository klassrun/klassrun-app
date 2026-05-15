// app/api/sessions/[id]/advance-term/route.ts
// batch-2c-phase-1-sessions-proxy

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }
  const result = await apiFetch<unknown>(
    `/api/sessions/${encodeURIComponent(id)}/advance-term`,
    { method: 'POST', token, body: {} },
  )
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not advance term' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}
