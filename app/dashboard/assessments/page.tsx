// app/dashboard/assessments/page.tsx
// batch-3-phase-3a-assessments-list-page
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getAuthCookie } from '@/lib/auth-cookie';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

async function fetchAssessments(): Promise<any[]> {
  const token = await getAuthCookie();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/assessments?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = await res.json().catch(() => ({}));
    return Array.isArray(body.assessments) ? body.assessments : [];
  } catch { return []; }
}

function typeLabel(t: string) {
  if (t === 'objective') return 'Objective';
  if (t === 'theory') return 'Theory';
  if (t === 'essay') return 'Essay';
  return t;
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

export default async function AssessmentsPage() {
  const assessments = await fetchAssessments();
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Exam Questions</h1>
        <Link
          href="/dashboard/assessments/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Generate questions
        </Link>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground mb-4">
            No exam questions yet. Generate your first set.
          </p>
          <Link
            href="/dashboard/assessments/new"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Generate questions
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {assessments.map((a) => {
            const q = a.questions || {};
            const count = Array.isArray(q.questions) ? q.questions.length : 0;
            const qType = q.questionType || '';
            return (
              <li key={a.id} className="rounded-lg border p-4 hover:bg-accent/40 transition">
                <Link href={`/dashboard/assessments/${a.id}`} className="block">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {a.class?.name} · {a.subject?.name} · {a.sessionStamp}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{count} question{count !== 1 ? 's' : ''}</span>
                    {qType && <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{typeLabel(qType)}</span>}
                    {a.totalMarks && <span>{a.totalMarks} marks</span>}
                    <span>Generated {formatRelative(a.createdAt)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
