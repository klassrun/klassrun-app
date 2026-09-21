// app/api/promotions/carry-over/route.ts
// student-record-app-v1: proxy — place unplaced students in their current class.

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(request: Request) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: { message: 'Request body must be valid JSON' } }, { status: 400 })
  }
  const result = await apiFetch<unknown>('/api/promotions/carry-over', { method: 'POST', token, body })
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? { message: 'Could not carry them over' } }, { status: result.status || 500 })
  }
  return NextResponse.json(result.data)
}
