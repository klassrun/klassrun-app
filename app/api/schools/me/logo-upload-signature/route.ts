// app/api/schools/me/logo-upload-signature/route.ts
// batch-2b-logo-proxy

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST() {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json(
      { error: { message: 'Not authenticated' } },
      { status: 401 },
    )
  }

  const result = await apiFetch<{
    signature: string
    timestamp: number
    cloudName: string
    apiKey: string
    preset: string
    folder: string
    publicId: string
  }>('/api/schools/me/logo-upload-signature', {
    method: 'POST',
    token,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not prepare upload' } },
      { status: result.status || 500 },
    )
  }
  return NextResponse.json(result.data)
}
