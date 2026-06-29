// app/dashboard/schemes/upload/page.tsx
// batch-4b-upload-page

export const dynamic = 'force-dynamic';

import { getAuthCookie } from '@/lib/auth-cookie';
import { redirect } from 'next/navigation';
import UploadSchemeClient from './upload-scheme-client';
import Link from 'next/link';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

async function fetchAssignments(): Promise<any[]> {
  const token = await getAuthCookie();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/teachers/me/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = await res.json().catch(() => ({}));
    const grouped = Array.isArray(body.assignments) ? body.assignments : [];
    const flat: any[] = [];
    for (const g of grouped) {
      const cls = g && g.class ? g.class : null;
      const subjects = g && Array.isArray(g.subjects) ? g.subjects : [];
      if (!cls) continue;
      for (const s of subjects) {
        flat.push({ subjectId: s.id, subjectName: s.name, classId: cls.id, className: cls.name, classLevel: cls.level ?? null });
      }
    }
    return flat;
  } catch {
    return [];
  }
}

async function fetchCurrentSession(): Promise<any | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/sessions?current=1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    if (Array.isArray(body.sessions)) {
      return body.sessions.find((s: any) => s.isCurrent) || body.sessions[0] || null;
    }
    return body.session || null;
  } catch {
    return null;
  }
}

async function getRole(): Promise<string | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    return body?.user?.role ?? null;
  } catch {
    return null;
  }
}

export default async function UploadSchemePage() {
  // Same role gate as schemes/new — uploading is teacher-only (owns the subject).
  const role = await getRole();
  if (!role) redirect('/login');
  if (role === 'SUPER_ADMIN') redirect('/admin');
  if (role === 'SCHOOL_ADMIN') redirect('/dashboard/schemes');

  const [assignments, session] = await Promise.all([fetchAssignments(), fetchCurrentSession()]);
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-6 pt-6">
        <Link href="/dashboard/schemes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Schemes</Link>
      </div>
      <UploadSchemeClient assignments={assignments} currentSession={session} />
    </div>
  );
}
