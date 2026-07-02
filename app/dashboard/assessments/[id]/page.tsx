// app/dashboard/assessments/[id]/page.tsx
// batch-3-phase-3a-assessments-detail-page
// batch-5-print-export
export const dynamic = 'force-dynamic';

import { getAuthCookie } from '@/lib/auth-cookie';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AssessmentRender from '../_components/assessment-render';
import { ExportButton, PrintHeader } from '../../_components/print-export';

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

async function fetchSchool(): Promise<{ name: string; logoUrl: string | null } | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    return body?.user?.school ?? null;
  } catch { return null; }
}

// hotfix-batch-3-phase-3d-assess-detail-await-params (Bug #74)
export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [assessment, school] = await Promise.all([fetchAssessment(id), fetchSchool()]);
  if (!assessment) notFound();

  const printSubtitle = [assessment.class?.name, assessment.subject?.name, assessment.sessionStamp]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* ops-5d-assessments-back */}
      <header className="border-b border-border bg-card/60 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <Link
          href="/dashboard/assessments"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Exam questions
        </Link>
        <ExportButton filename={`${assessment.title || 'Exam Questions'} - Exam`} showAnswersToggle />
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:py-16 print:py-0">
        <PrintHeader
          school={school}
          documentKind="Exam Questions"
          title={String(assessment.title || '')}
          subtitle={printSubtitle}
        />
        <AssessmentRender assessment={assessment} />
      </div>
    </div>
  );
}
