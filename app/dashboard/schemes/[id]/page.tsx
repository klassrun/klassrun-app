// app/dashboard/schemes/[id]/page.tsx
// batch-3-phase-2-schemes-detail-page

export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { SchemeRender } from '../_components/scheme-render';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

async function fetchScheme(id: string): Promise<any | null> {
  const token = (await cookies()).get('klassrun_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/schemes/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    return body.scheme || null;
  } catch {
    return null;
  }
}

type Params = { params: Promise<{ id: string }> };

export default async function SchemeDetailPage({ params }: Params) {
  const { id } = await params;
  const scheme = await fetchScheme(id);
  if (!scheme) notFound();
  return <SchemeRender scheme={scheme} />;
}
