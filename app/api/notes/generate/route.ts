// app/api/notes/generate/route.ts
// batch-3-phase-1-notes-generate-proxy

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(request: Request) {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const result = await apiFetch('/api/notes/generate', {
    method: 'POST',
    body,
    token,
  })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not generate lesson note' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 201 })
}
