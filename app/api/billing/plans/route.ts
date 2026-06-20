// app/api/billing/plans/route.ts
// gate2-proxy-plans
import { getAuthCookie } from '@/lib/auth-cookie';
import { NextResponse } from 'next/server';

const API = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

export async function GET() {
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  const res = await fetch(`${API}/api/billing/plans`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
