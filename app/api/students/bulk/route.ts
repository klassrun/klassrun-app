// app/api/students/bulk/route.ts
// app-bulk-import-v1
//
// Forwards the CSV bytes to the API untouched. request.text(), NOT
// request.json() - parsing here would defeat the point and mangle the file.
import { NextResponse, type NextRequest } from 'next/server'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'

export async function POST(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })

  const csv = await request.text().catch(() => '')
  if (!csv.trim()) {
    return NextResponse.json({ error: { message: 'No CSV content received' } }, { status: 400 })
  }

  const result = await apiFetch<unknown>('/api/students/bulk', {
    method: 'POST',
    token,
    rawBody: csv,
    rawContentType: 'text/csv',
  })

  if (!result.ok) {
    // The API's error body carries the per-row errors array. Pass it through
    // whole (ApiResponse.raw) - a bare message would throw away the one thing
    // that tells the admin WHICH lines to fix.
    const raw = result.raw as Record<string, unknown> | null
    return NextResponse.json(
      raw && typeof raw === 'object' ? raw : { error: result.error ?? { message: 'Import failed' } },
      { status: result.status || 500 }
    )
  }
  return NextResponse.json(result.data, { status: result.status })
}
