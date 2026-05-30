// app/api/assessments/topics/route.ts
// batch-3-phase-3c-topics-proxy
import { getAuthCookie } from '@/lib/auth-cookie';
import { NextRequest, NextResponse } from 'next/server';
const API = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';
export async function GET(req: NextRequest) {
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(`${API}/api/assessments/topics${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}
