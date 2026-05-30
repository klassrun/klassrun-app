// app/api/assessments/[id]/route.ts
// batch-3-phase-3a-assessments-proxy-detail
import { getAuthCookie } from '@/lib/auth-cookie';
import { NextRequest, NextResponse } from 'next/server';
const API = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  const res = await fetch(`${API}/api/assessments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${API}/api/assessments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  const res = await fetch(`${API}/api/assessments/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
