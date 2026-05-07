// app/api/auth/invite/resend/[teacherId]/route.ts
//
// School admin resends an invite to a previously-invited teacher.
// Used when the teacher loses or doesn't receive the original email.

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  const { teacherId } = await params
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json(
      { error: { message: 'Not authenticated' } },
      { status: 401 },
    )
  }

  const result = await apiFetch<{ message: string }>(
    `/api/auth/invite/resend/${encodeURIComponent(teacherId)}`,
    { method: 'POST', token },
  )

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not resend invite' } },
      { status: result.status || 500 },
    )
  }

  return NextResponse.json(result.data, { status: 200 })
}
