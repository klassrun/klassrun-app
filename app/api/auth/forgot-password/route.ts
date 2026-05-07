// app/api/auth/forgot-password/route.ts
//
// Proxies forgot-password requests to klassrun-api. No cookie handling
// because the user isn't authenticated yet.

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

  const result = await apiFetch<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not send reset email' } },
      { status: result.status || 500 },
    )
  }

  return NextResponse.json(result.data, { status: 200 })
}
