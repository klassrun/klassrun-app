// app/api/report-cards/class-pdf/route.ts
// rc-class-pdf-app-v1
//
// Streams the whole-class report-card PDF from klassrun-api. apiFetch only
// speaks JSON/text, so this route fetches the API directly and passes the PDF
// bytes through untouched. Opened in a browser tab, an error shows a readable
// page instead of raw JSON.
import { NextResponse, type NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth-cookie'

const API_BASE = process.env.KLASSRUN_API_URL || 'http://localhost:4000'

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

function errorResponse(request: NextRequest, status: number, message: string) {
  const wantsHtml = (request.headers.get('accept') || '').includes('text/html')
  if (!wantsHtml) return NextResponse.json({ error: { message } }, { status })
  const safe = message.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c)
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Report cards</title></head>' +
    '<body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:64px auto;padding:0 24px;color:#131b26">' +
    '<h1 style="font-size:20px;margin:0 0 12px">Couldn&#39;t open the report cards</h1>' +
    `<p style="line-height:1.5">${safe}</p>` +
    '<p style="color:#6b7280;line-height:1.5">Close this tab and try again from the Report cards page.</p></body></html>'
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

export async function GET(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) return errorResponse(request, 401, 'You are signed out. Sign in again, then retry.')
  const qs = new URL(request.url).search || ''
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/report-cards/class-pdf${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch {
    return errorResponse(request, 502, 'Could not reach the Klassrun server. Check your connection and try again.')
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    return errorResponse(request, res.status, body?.error?.message || `Request failed (${res.status})`)
  }
  const pdf = await res.arrayBuffer()
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': res.headers.get('content-disposition') || 'inline; filename="report-cards.pdf"',
      'Cache-Control': 'no-store',
      'X-Report-Card-Count': res.headers.get('x-report-card-count') || '',
    },
  })
}
