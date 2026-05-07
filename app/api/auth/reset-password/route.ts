// app/api/auth/reset-password/route.ts
//
// Proxies password reset to klassrun-api. No cookie handling — after
// reset, user goes to /login to sign in with their new password.

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: { message: 'Request body must be valid JSON' } },
      { status: 400 },
    )
  }

  const result = await apiFetch<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not reset password' } },
      { status: result.status || 500 },
    )
  }

  return NextResponse.json(result.data, { status: 200 })
}
