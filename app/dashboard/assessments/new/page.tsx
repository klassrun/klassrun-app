// app/dashboard/assessments/new/page.tsx
// batch-3-phase-3a-assessments-new-page
export const dynamic = 'force-dynamic';

import { getAuthCookie } from '@/lib/auth-cookie';
import { redirect } from 'next/navigation';
import NewAssessmentClient from './new-assessment-client';
import Link from 'next/link';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

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
  } catch { return null; }
}

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
    // API groups by class: { class: {id,name,level}, subjects: [{id,name},...] }[]
    const grouped = Array.isArray(body.assignments) ? body.assignments : [];
    const flat: any[] = [];
    for (const g of grouped) {
      const cls = g?.class ?? null;
      const subjects = Array.isArray(g?.subjects) ? g.subjects : [];
      if (!cls) continue;
      for (const s of subjects) {
        flat.push({ subjectId: s.id, subjectName: s.name, classId: cls.id, className: cls.name, classLevel: cls.level ?? null });
      }
    }
    return flat;
  } catch { return []; }
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
    if (Array.isArray(body.sessions)) return body.sessions.find((s: any) => s.isCurrent) || body.sessions[0] || null;
    return body.session || null;
  } catch { return null; }
}

export default async function NewAssessmentPage() {
  const role = await getRole();
  if (!role) redirect('/login');
  if (role === 'SUPER_ADMIN') redirect('/admin');
  if (role === 'SCHOOL_ADMIN') redirect('/dashboard/assessments');

  const [assignments, session] = await Promise.all([fetchAssignments(), fetchCurrentSession()]);
  // batch-3-phase-3c-page-session-id
  return (
    <div className="min-h-screen bg-paper">
      {/* ops-5e-assessments-new-back */}
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to dashboard</Link>
      </div>
      <NewAssessmentClient assignments={assignments} currentSession={session} />
    </div>
  );
}
