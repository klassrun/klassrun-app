// app/api/results/bulk/route.ts
// results-bulk-app-v1: proxy for the bulk score upload (preview + save).

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export const maxDuration = 60

export async function POST(request: Request) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: { message: 'Request body must be valid JSON' } }, { status: 400 })
  }
  const result = await apiFetch<unknown>('/api/results/bulk', { method: 'POST', token, body })
  if (!result.ok) {
    return NextResponse.json(
      result.raw ?? { error: result.error ?? { message: 'Could not upload the scores' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}
