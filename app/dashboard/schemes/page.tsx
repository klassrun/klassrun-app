// app/dashboard/schemes/page.tsx
// batch-3-phase-2-schemes-list-page

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { cookies } from 'next/headers';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

async function fetchSchemes(): Promise<any[]> {
  const token = (await cookies()).get('klassrun_token')?.value;
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/schemes?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = await res.json().catch(() => ({}));
    return Array.isArray(body.schemes) ? body.schemes : [];
  } catch {
    return [];
  }
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString();
}

export default async function SchemesPage() {
  const schemes = await fetchSchemes();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Schemes of Work</h1>
        <Link
          href="/dashboard/schemes/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New scheme
        </Link>
      </div>

      {schemes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground mb-4">
            No schemes yet. Generate your first 12-week scheme of work.
          </p>
          <Link
            href="/dashboard/schemes/new"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Generate a scheme
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {schemes.map((s) => (
            <li key={s.id} className="rounded-lg border p-4 hover:bg-accent/40 transition">
              <Link href={`/dashboard/schemes/${s.id}`} className="block">
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-muted-foreground">
                  {s.class?.name} · {s.subject?.name} · {s.sessionStamp}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Generated {formatRelative(s.createdAt)}
                  {s.isEdited ? ' · edited' : ''}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
