// app/api/students/photo-signature/route.ts
// ops-1b-students-proxy
//
// The Ops 1a API wraps the signature as { signature: { ...flat fields... } } —
// one level deeper than the logo endpoint (which returns the flat fields at top
// level). We unwrap here so the client photo-upload component mirrors the
// existing LogoUpload flow exactly.
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const result = await apiFetch<{ signature?: unknown }>('/api/students/photo-signature', { method: 'POST', token, body })
  if (!result.ok) return NextResponse.json({ error: result.error ?? { message: 'Could not prepare upload' } }, { status: result.status || 500 })
  const data = result.data as { signature?: unknown } | null
  const sig = data && typeof data === 'object' && 'signature' in data ? (data as { signature: unknown }).signature : data
  return NextResponse.json(sig)
}
