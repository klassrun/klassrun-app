// app/dashboard/question-bank/page.tsx
// batch-3-phase-3b-bank-page
export const dynamic = 'force-dynamic';

import { getAuthCookie } from '@/lib/auth-cookie';
import BankClient from './_components/bank-client';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

async function fetchInitialBank(): Promise<{ entries: any[]; total: number }> {
  const token = await getAuthCookie();
  if (!token) return { entries: [], total: 0 };
  try {
    const res = await fetch(`${API_BASE}/api/assessments/bank?limit=50&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { entries: [], total: 0 };
    const body = await res.json().catch(() => ({}));
    return { entries: Array.isArray(body.entries) ? body.entries : [], total: body.total ?? 0 };
  } catch { return { entries: [], total: 0 }; }
}

async function fetchSubjects(): Promise<any[]> {
  // batch-3-phase-3d-bank-subjects-flatten
  // /api/subjects needs a classId; the dropdown must use the teacher's
  // assignments instead, which are grouped by class (Bug #70 — flatten + dedup).
  const token = await getAuthCookie();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/teachers/me/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = await res.json().catch(() => ({}));
    const assignments = Array.isArray(body.assignments) ? body.assignments : [];
    const seen = new Set<string>();
    const flat: any[] = [];
    for (const a of assignments) {
      const cls = a && a.class ? { name: a.class.name } : undefined;
      const subs = a && Array.isArray(a.subjects) ? a.subjects : [];
      for (const s of subs) {
        if (!s || s.archivedAt || seen.has(s.id)) continue;
        seen.add(s.id);
        flat.push({ id: s.id, name: s.name, class: cls });
      }
    }
    return flat;
  } catch { return []; }
}

export default async function QuestionBankPage() {
  const [{ entries, total }, subjects] = await Promise.all([
    fetchInitialBank(),
    fetchSubjects(),
  ]);

  return (
    <BankClient
      initialEntries={entries}
      initialTotal={total}
      subjects={subjects}
    />
  );
}
