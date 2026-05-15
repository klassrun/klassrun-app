// app/api/classes/[id]/route.ts
// batch-2c-phase-2-classes-proxy-id

import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie'

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com'

async function getToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(AUTH_COOKIE_NAME)?.value ?? null
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const token = await getToken()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })

  const { id } = await ctx.params
  const payload = await request.json().catch(() => ({}))
  const res = await fetch(`${API_BASE}/api/classes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const body = await res.json().catch(() => ({}))
  return NextResponse.json(body, { status: res.status })
}
