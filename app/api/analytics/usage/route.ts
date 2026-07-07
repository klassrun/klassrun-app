// app/api/analytics/usage/route.ts
// batch-6-proxy-analytics-usage
import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie } from '@/lib/auth-cookie';
const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

export async function GET(_req: NextRequest) {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }
  const res = await fetch(`${API_BASE}/api/analytics/usage`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}
