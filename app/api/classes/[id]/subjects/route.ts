// app/api/classes/[id]/subjects/route.ts
// batch-2c-phase-3a-subjects-list-proxy

import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

  const { id } = await context.params
  const url = new URL(req.url)
  const qs = url.searchParams.get('includeArchived') === 'true' ? '?includeArchived=true' : ''

  try {
    const data = await apiFetch<{ subjects: unknown[] }>(`/api/classes/${id}/subjects${qs}`, { token })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: { message: e?.message || 'Failed to fetch subjects' } },
      { status: e?.status || 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

  const { id } = await context.params
  const body = await req.json().catch(() => ({}))

  try {
    const data = await apiFetch<{ subject: unknown }>(`/api/classes/${id}/subjects`, {
      method: 'POST',
      token,
      body,
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    return NextResponse.json(
      { error: { message: e?.message || 'Failed to create subject' } },
      { status: e?.status || 500 }
    )
  }
}
