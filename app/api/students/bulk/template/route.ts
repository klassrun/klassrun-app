// app/api/students/bulk/template/route.ts
// app-bulk-import-v1
//
// The API builds the template (it knows the school's class names), so this
// only relays it. asText because the body is CSV, not JSON.
import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function GET() {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })

  const result = await apiFetch<string>('/api/students/bulk/template', { token, asText: true })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? { message: 'Could not build the template' } },
      { status: result.status || 500 }
    )
  }
  return new NextResponse(result.data ?? '', {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="klassrun-students-template.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
