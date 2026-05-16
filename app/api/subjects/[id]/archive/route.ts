// app/api/subjects/[id]/archive/route.ts
// batch-2c-phase-3a-subjects-archive-proxy

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

  try {
    const data = await apiFetch<{ subject: unknown }>(`/api/subjects/${id}/archive`, {
      method: 'POST',
      token,
    })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: { message: e?.message || 'Failed to archive subject' } },
      { status: e?.status || 500 }
    )
  }
}
