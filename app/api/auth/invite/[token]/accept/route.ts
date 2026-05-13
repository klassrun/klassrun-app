// app/api/auth/invite/[token]/accept/route.ts
//
// Public endpoint — teacher uses the invite link to set their password
// and complete account setup. Returns a JWT and sets the auth cookie
// so the teacher is logged in immediately after.
//
// Body: { password }

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { setAuthCookie, setRoleCookie } from '@/lib/auth-cookie'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: inviteToken } = await params

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: { message: 'Request body must be valid JSON' } },
      { status: 400 },
    )
  }

  const result = await apiFetch<{
    token: string
    user: { id: string; email: string; role: string; schoolId: string | null }
  }>(`/api/auth/invite/${encodeURIComponent(inviteToken)}/accept`, {
    method: 'POST',
    body,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not accept invite' } },
      { status: result.status || 500 },
    )
  }

  // Set the JWT in an httpOnly cookie so the teacher is now logged in
  if (result.data?.token) {
    await setAuthCookie(result.data.token)
    if (result.data.user?.role) {
      await setRoleCookie(result.data.user.role)
    }
  }

  return NextResponse.json(
    { user: result.data?.user, message: 'Invite accepted' },
    { status: 200 },
  )
}
