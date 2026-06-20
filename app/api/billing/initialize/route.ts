// app/api/billing/initialize/route.ts
// gate2-proxy-initialize
import { getAuthCookie } from '@/lib/auth-cookie';
import { NextRequest, NextResponse } from 'next/server';

const API = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

export async function POST(req: NextRequest) {
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${API}/api/billing/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
