// app/api/auth/login/route.ts
//
// Proxies login to klassrun-api. On success, sets the JWT cookie.

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { setAuthCookie } from '@/lib/auth-cookie'

type LoginResponse = {
  message: string
  token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    schoolId: string | null
    schoolName: string | null
    schoolSlug: string | null
    schoolStatus: string | null
  }
  portalUrl: string | null
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: { message: 'Email and password required' } },
      { status: 400 },
    )
  }

  const result = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body,
  })

  if (!result.ok || !result.data) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Login failed' } },
      { status: result.status || 401 },
    )
  }

  await setAuthCookie(result.data.token)

  const { token: _token, ...rest } = result.data
  return NextResponse.json(rest)
}
