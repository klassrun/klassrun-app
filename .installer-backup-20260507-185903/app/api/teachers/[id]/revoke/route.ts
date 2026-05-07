// app/api/teachers/[id]/revoke/route.ts

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json(
      { error: { message: 'Not authenticated' } },
      { status: 401 },
    )
  }

  const result = await apiFetch<{ message: string }>(`/api/teachers/${encodeURIComponent(id)}/revoke`, {
    method: 'PATCH',
    token,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not revoke teacher' } },
      { status: result.status || 500 },
    )
  }

  return NextResponse.json(result.data, { status: 200 })
}
