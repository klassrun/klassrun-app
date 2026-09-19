// app/api/schools/grading-config/route.ts
// grading-config-app-v1: proxy for the school's score breakdown.
// GET — any staff. PUT — SCHOOL_ADMIN (enforced by the API).

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET() {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const result = await apiFetch<unknown>('/api/schools/grading-config', { token })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not load the score breakdown' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}

export async function PUT(request: Request) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: { message: 'Request body must be valid JSON' } }, { status: 400 })
  }
  const result = await apiFetch<unknown>('/api/schools/grading-config', { method: 'PUT', token, body })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not save the score breakdown' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}
