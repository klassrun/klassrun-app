// app/api/notes/generate/route.ts
// batch-3-phase-1-notes-generate-proxy

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

// klassrun-periods-app-v1: a note split across several periods takes ~1 minute.
export const maxDuration = 120

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
    // bugfix-dedup-copy-v1: pass the raw API body through so rich error
    // payloads (error.code, existingNote on 409) reach the client.
    return NextResponse.json(
      result.raw ?? { error: result.error ?? { message: 'Could not generate lesson note' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 201 })
}
