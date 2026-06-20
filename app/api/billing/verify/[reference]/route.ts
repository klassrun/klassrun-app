// app/api/billing/verify/[reference]/route.ts
// gate2-proxy-verify
import { getAuthCookie } from '@/lib/auth-cookie';
import { NextRequest, NextResponse } from 'next/server';

const API = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  const { reference } = await params;
  const res = await fetch(`${API}/api/billing/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
