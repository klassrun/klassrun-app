// app/api/portal/login/route.ts
// ops-5c-portal-login-route
import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { setPortalCookie } from '@/lib/auth-cookie'

type PortalLoginResponse = {
  message: string
  token: string
  student: {
    id: string; admissionNumber: string; firstName: string; lastName: string
    schoolId: string; schoolName: string | null; schoolSlug: string | null
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.slug || !body?.admissionNumber || !body?.password) {
    return NextResponse.json(
      { error: { message: 'School, admission number and password are required' } },
      { status: 400 },
    )
  }

  const result = await apiFetch<PortalLoginResponse>('/api/portal/login', { method: 'POST', body })
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Login failed' } },
      { status: result.status || 401 },
    )
  }

  await setPortalCookie(result.data.token)
  const { token: _token, ...rest } = result.data
  return NextResponse.json(rest)
}
