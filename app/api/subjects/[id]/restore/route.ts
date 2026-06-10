// app/api/subjects/[id]/restore/route.ts
// batch-2c-phase-3a-subjects-restore-proxy
// fix-1-envelope: unwrap apiFetch result; propagate real error status.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

  const { id } = await context.params

  const result = await apiFetch<{ subject: unknown }>(
    `/api/subjects/${encodeURIComponent(id)}/restore`,
    { method: 'POST', token },
  )

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Failed to restore subject' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 200 })
}
