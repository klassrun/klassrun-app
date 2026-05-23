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
    return Array.isArray(body.assignments) ? body.assignments : [];
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
