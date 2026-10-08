// app/api/sessions/[id]/next-term-begins/route.ts
// rc-next-term-app-v1 — proxies PUT /api/sessions/:id/next-term-begins { term, date|null }
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const result = await apiFetch<unknown>(`/api/sessions/${encodeURIComponent(id)}/next-term-begins`, { method: 'PUT', token, body })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not save the date' } }, { status: result.status || 500 })
  return NextResponse.json(result.data)
}
