// app/dashboard/schemes/new/page.tsx
// batch-3-phase-2-schemes-new-page

export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import NewSchemeClient from './new-scheme-client';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

async function fetchAssignments(): Promise<any[]> {
  const token = (await cookies()).get('klassrun_token')?.value;
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/teachers/me/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = await res.json().catch(() => ({}));
    // hotfix-batch-3-phase-2-flatten-assignments
    // The API groups assignments by class:
    //   { class: {id,name,level}, subjects: [{id,name}, ...] }[]
    // The client form expects a flat list. Flatten here.
    const grouped = Array.isArray(body.assignments) ? body.assignments : [];
    const flat: any[] = [];
    for (const g of grouped) {
      const cls = g && g.class ? g.class : null;
      const subjects = g && Array.isArray(g.subjects) ? g.subjects : [];
      if (!cls) continue;
      for (const s of subjects) {
        flat.push({
          subjectId:   s.id,
          subjectName: s.name,
          classId:     cls.id,
          className:   cls.name,
          classLevel:  cls.level ?? null,
        });
      }
    }
    return flat;
  } catch {
    return [];
  }
}

async function fetchCurrentSession(): Promise<any | null> {
  const token = (await cookies()).get('klassrun_token')?.value;
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

export default async function NewSchemePage() {
  const [assignments, session] = await Promise.all([fetchAssignments(), fetchCurrentSession()]);
  return <NewSchemeClient assignments={assignments} currentSession={session} />;
}
