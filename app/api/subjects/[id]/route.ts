// app/api/subjects/[id]/route.ts
// batch-2c-phase-3a-subjects-patch-proxy

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

  try {
    const data = await apiFetch<{ subject: unknown }>(`/api/subjects/${id}`, {
      method: 'PATCH',
      token,
      body,
    })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: { message: e?.message || 'Failed to update subject' } },
      { status: e?.status || 500 }
    )
  }
}
