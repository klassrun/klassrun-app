// app/api/promotions/[id]/reverse/route.ts
// ops-3b-promotions-proxy
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const { id } = await params
  const result = await apiFetch<unknown>(`/api/promotions/${id}/reverse`, { method: 'POST', token })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not reverse promotion' } }, { status: result.status || 500 })
  return NextResponse.json(result.data)
}
