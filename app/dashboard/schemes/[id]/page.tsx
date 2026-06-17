// app/dashboard/schemes/[id]/page.tsx
// batch-3-phase-2-schemes-detail-page

export const dynamic = 'force-dynamic';

import { getAuthCookie } from '@/lib/auth-cookie';
import { notFound } from 'next/navigation';
import { SchemeRender } from '../_components/scheme-render';
import Link from 'next/link';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

async function fetchScheme(id: string): Promise<any | null> {
  const token = await getAuthCookie();
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
  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* ops-5d-schemes-back */}
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link
            href="/dashboard/schemes"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Schemes
          </Link>
        </div>
      </header>
      <SchemeRender scheme={scheme} />
    </div>
  );
}
