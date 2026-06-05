// app/api/promotions/eligibility/route.ts
// ops-3b-promotions-proxy
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const url = new URL(request.url)
  const qs = url.search || ''
  const result = await apiFetch<unknown>(`/api/promotions/eligibility${qs}`, { token })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not load eligibility' } }, { status: result.status || 500 })
  return NextResponse.json(result.data)
}
