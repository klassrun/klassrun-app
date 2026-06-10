// app/api/subjects/[id]/route.ts
// batch-2c-phase-3a-subjects-patch-proxy
// fix-1-envelope: unwrap apiFetch result; propagate real error status.
// This route handles teacher assignment (PATCH {teacherId}) — before this
// fix, a failed assignment returned 200 and showed a success toast.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

  const { id } = await context.params
  const body = await req.json().catch(() => ({}))

  const result = await apiFetch<{ subject: unknown }>(
    `/api/subjects/${encodeURIComponent(id)}`,
    { method: 'PATCH', token, body },
  )

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Failed to update subject' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data, { status: 200 })
}
