// app/api/students/[id]/route.ts
// ops-1b-students-proxy
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const { id } = await ctx.params
  const result = await apiFetch<unknown>(`/api/students/${encodeURIComponent(id)}`, { token })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not load student' } }, { status: result.status || 500 })
  return NextResponse.json(result.data)
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const result = await apiFetch<unknown>(`/api/students/${encodeURIComponent(id)}`, { method: 'PATCH', token, body })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not update student' } }, { status: result.status || 500 })
  return NextResponse.json(result.data)
}
