// app/api/promotions/unplaced/route.ts
// student-record-app-v1: proxy — students with no class in the current session.

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET() {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const result = await apiFetch<unknown>('/api/promotions/unplaced', { token })
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? { message: 'Could not load' } }, { status: result.status || 500 })
  }
  return NextResponse.json(result.data)
}
