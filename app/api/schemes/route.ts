// app/api/schemes/route.ts
// batch-3-phase-2-schemes-proxy-list
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

export async function GET(req: NextRequest) {
  const token = (await cookies()).get('klassrun_token')?.value;
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }
  const url = new URL('/api/schemes', API_BASE);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}
