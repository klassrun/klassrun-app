// app/api/notes/route.ts
// batch-3-phase-1-notes-list-proxy

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET(request: Request) {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }
  const url = new URL(request.url)
  const qs = url.search
  const result = await apiFetch(`/api/notes${qs}`, { token })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not load notes' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 200 })
}
