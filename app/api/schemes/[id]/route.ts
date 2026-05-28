// app/api/schemes/[id]/route.ts
// batch-3-phase-2-schemes-proxy-detail
import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie } from '@/lib/auth-cookie';
const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

async function forward(req: NextRequest, id: string, method: 'GET' | 'PATCH' | 'DELETE') {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }
  const init: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  };
  if (method === 'PATCH') {
    let body: any = {};
    try { body = await req.json(); } catch { /* empty */ }
    init.headers = { ...init.headers, 'Content-Type': 'application/json' };
    (init as any).body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}/api/schemes/${encodeURIComponent(id)}`, init);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return forward(req, id, 'GET');
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return forward(req, id, 'PATCH');
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return forward(req, id, 'DELETE');
}
