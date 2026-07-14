// app/api/notes/[id]/duplicate/route.ts
// bugfix-dedup-copy-v1 — proxy for copy-to-class (zero AI cost on the API)

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = await apiFetch(`/api/notes/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
    body,
    token,
  })
  if (!result.ok) {
    return NextResponse.json(
      result.raw ?? { error: result.error ?? { message: 'Could not copy lesson note' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 201 })
}
