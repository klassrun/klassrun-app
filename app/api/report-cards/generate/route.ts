// app/api/report-cards/generate/route.ts
// ops-1b-reportcards-proxy
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const result = await apiFetch<unknown>('/api/report-cards/generate', { method: 'POST', token, body })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not generate report cards' } }, { status: result.status || 500 })
  return NextResponse.json(result.data)
}
