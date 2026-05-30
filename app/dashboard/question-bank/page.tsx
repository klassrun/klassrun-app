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
  const token = await getAuthCookie();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/subjects`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = await res.json().catch(() => ({}));
    return Array.isArray(body.subjects) ? body.subjects : [];
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
