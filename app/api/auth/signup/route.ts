// app/api/auth/signup/route.ts
//
// Proxies signup to klassrun-api. On success, stores the JWT in an
// httpOnly cookie so client JS can't access it.

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { setAuthCookie, setRoleCookie } from '@/lib/auth-cookie'

type SignupResponse = {
  message: string
  token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    schoolId: string
    schoolName: string
    schoolSlug: string
    schoolStatus: string
  }
  portalUrl: string
  trialEndsAt: string
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: { message: 'Request body must be valid JSON' } },
      { status: 400 },
    )
  }

  const result = await apiFetch<SignupResponse>('/api/auth/signup', {
    method: 'POST',
    body,
  })

  if (!result.ok || !result.data) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Signup failed' } },
      { status: result.status || 500 },
    )
  }

  await setAuthCookie(result.data.token)
  await setRoleCookie(result.data.user.role)

  // Strip the token from the response — it's now in the httpOnly cookie
  const { token: _token, ...rest } = result.data
  return NextResponse.json(rest, { status: 201 })
}
