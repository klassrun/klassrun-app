// app/api/schemes/upload/route.ts
// batch-4b-proxy-upload
import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie } from '@/lib/auth-cookie';
const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

export async function POST(req: NextRequest) {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }
  let body: any = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const res = await fetch(`${API_BASE}/api/schemes/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}
