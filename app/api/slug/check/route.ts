// app/api/slug/check/route.ts
//
// Live availability check — used by the signup form as the user types.
// Pure pass-through to klassrun-api.

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json(
      { error: { message: 'slug query parameter is required' } },
      { status: 400 },
    )
  }

  const result = await apiFetch(
    `/api/slug/check?slug=${encodeURIComponent(slug)}`,
  )
  return NextResponse.json(result.data ?? result.error, {
    status: result.status || 200,
  })
}
