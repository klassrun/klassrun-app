// app/api/teachers/me/assignments/route.ts
//
// GET: list the calling teacher's active subject assignments, grouped by class
//
// batch-2c-phase-4a-teachers-assignments-proxy

import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET() {
  const token = await getAuthCookie()
  if (!token) {
    return NextResponse.json(
      { error: { message: 'Not authenticated' } },
      { status: 401 },
    )
  }

  const result = await apiFetch<{
    assignments: Array<{
      class: { id: string; name: string; level: string | null }
      subjects: Array<{
        id: string
        name: string
        archivedAt: string | null
        createdAt: string
      }>
    }>
    totalSubjects: number
    totalClasses: number
  }>('/api/teachers/me/assignments', {
    method: 'GET',
    token,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not load assignments' } },
      { status: result.status || 500 },
    )
  }

  return NextResponse.json(result.data, { status: 200 })
}
