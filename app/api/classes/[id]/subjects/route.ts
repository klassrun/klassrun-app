// app/api/classes/[id]/subjects/route.ts
// batch-2c-phase-3a-subjects-list-proxy
// fix-1-envelope: apiFetch returns {ok,status,data,error} and never throws.
// Previously we returned that whole envelope with status 200/201, which
// (a) broke client reload() reading data.subjects, and (b) reported success
// toasts for failed backend calls. Now we unwrap and propagate real status.

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

  const result = await apiFetch<{ subjects: unknown[] }>(
    `/api/classes/${encodeURIComponent(id)}/subjects${qs}`,
    { token },
  )

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Failed to fetch subjects' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 200 })
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

  const { id } = await context.params
  const body = await req.json().catch(() => ({}))

  const result = await apiFetch<{ subject: unknown }>(
    `/api/classes/${encodeURIComponent(id)}/subjects`,
    { method: 'POST', token, body },
  )

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Failed to create subject' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 201 })
}
