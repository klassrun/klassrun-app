// app/api/teachers/route.ts
//
// GET: list teachers for the authenticated school admin's school

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET() {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json(
      { error: { message: 'Not authenticated' } },
      { status: 401 },
    )
  }

  const result = await apiFetch<{ teachers: unknown[] }>('/api/teachers', {
    method: 'GET',
    token,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not load teachers' } },
      { status: result.status || 500 },
    )
  }

  return NextResponse.json(result.data, { status: 200 })
}
