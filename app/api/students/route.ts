// app/api/students/route.ts
// ops-1b-students-proxy
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const url = new URL(request.url)
  const qs = url.search || ''
  const result = await apiFetch<unknown>(`/api/students${qs}`, { token })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not load students' } }, { status: result.status || 500 })
  return NextResponse.json(result.data)
}

export async function POST(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const result = await apiFetch<unknown>('/api/students', { method: 'POST', token, body })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not create student' } }, { status: result.status || 500 })
  return NextResponse.json(result.data, { status: result.status })
}
