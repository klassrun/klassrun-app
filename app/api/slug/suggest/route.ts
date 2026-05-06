// app/api/slug/suggest/route.ts

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name  = searchParams.get('name')
  const state = searchParams.get('state')

  if (!name) {
    return NextResponse.json(
      { error: { message: 'name query parameter is required' } },
      { status: 400 },
    )
  }

  const params = new URLSearchParams({ name })
  if (state) params.set('state', state)

  const result = await apiFetch(`/api/slug/suggest?${params.toString()}`)
  return NextResponse.json(result.data ?? result.error, {
    status: result.status || 200,
  })
}
