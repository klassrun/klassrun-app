// app/dashboard/assessments/[id]/page.tsx
// batch-3-phase-3a-assessments-detail-page
export const dynamic = 'force-dynamic';

import { getAuthCookie } from '@/lib/auth-cookie';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AssessmentRender from '../_components/assessment-render';

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com';

async function fetchAssessment(id: string): Promise<any | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/assessments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    return body.assessment || null;
  } catch { return null; }
}

// hotfix-batch-3-phase-3d-assess-detail-await-params (Bug #74)
export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assessment = await fetchAssessment(id);
  if (!assessment) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/assessments"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Exam questions
        </Link>
      </div>
      <AssessmentRender assessment={assessment} />
    </div>
  );
}
