// app/api/notes/[id]/route.ts
// batch-3-phase-1-notes-detail-proxy

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }
  const { id } = await params
  const result = await apiFetch(`/api/notes/${encodeURIComponent(id)}`, { token })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not load lesson note' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 200 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = await apiFetch(`/api/notes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
    token,
  })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not update lesson note' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 200 })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  }
  const { id } = await params
  const result = await apiFetch(`/api/notes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not delete lesson note' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 200 })
}
