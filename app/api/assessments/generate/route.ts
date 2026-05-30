// app/api/assessments/generate/route.ts
// batch-3-phase-3a-assessments-proxy-generate
import { getAuthCookie } from '@/lib/auth-cookie';
import { NextRequest, NextResponse } from 'next/server';
const API = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';
export async function POST(req: NextRequest) {
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${API}/api/assessments/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
