// app/api/portal/accept/[token]/route.ts
// ops-5c-portal-accept-route
import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { setPortalCookie } from '@/lib/auth-cookie'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: { message: 'Request body must be valid JSON' } }, { status: 400 })
  }

  const result = await apiFetch<{ token: string; student: unknown }>(
    `/api/portal/accept/${encodeURIComponent(token)}`,
    { method: 'POST', body },
  )
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not set up access' } },
      { status: result.status || 500 },
    )
  }

  await setPortalCookie(result.data.token)
  return NextResponse.json({ student: result.data.student, message: 'Portal access set up' })
}
