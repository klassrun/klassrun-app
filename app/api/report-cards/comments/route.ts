// app/api/report-cards/comments/route.ts
// ops-2b-comments-proxy
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const url = new URL(request.url)
  const qs = url.search || ''
  const result = await apiFetch<unknown>(`/api/report-cards/comments${qs}`, { token })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not load comments' } }, { status: result.status || 500 })
  return NextResponse.json(result.data)
}

export async function PUT(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const result = await apiFetch<unknown>('/api/report-cards/comments', { method: 'PUT', token, body })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not save comment' } }, { status: result.status || 500 })
  return NextResponse.json(result.data)
}
