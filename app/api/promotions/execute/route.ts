// app/api/promotions/execute/route.ts
// ops-3b-promotions-proxy
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const result = await apiFetch<unknown>('/api/promotions/execute', { method: 'POST', token, body })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not execute promotion' } }, { status: result.status || 500 })
  return NextResponse.json(result.data, { status: result.status })
}
