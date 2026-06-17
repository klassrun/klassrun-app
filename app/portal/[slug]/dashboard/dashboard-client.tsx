'use client'
// app/portal/[slug]/dashboard/dashboard-client.tsx
// ops-5c-portal-dashboard-client
import { useState } from 'react'
import Link from 'next/link'

type Summary = { average?: number; aggregate?: number; overallPosition?: number; classSize?: number; cumulativeAverage?: number | null } | null
type Card = { id: string; term: string; session: { id: string; name: string } | null; sessionId: string; lockedAt: string | null; pdfUrl: string | null; hasPdf: boolean; summary: Summary }
type Me = {
  student: { id: string; admissionNumber: string; firstName: string; lastName: string; className: string | null }
  school: { id: string; name: string | null; slug: string | null }
  currentSession: { id: string; name: string; currentTerm: string } | null
}
type Fees = { session: { id: string; name: string } | null; currentTerm: string | null; terms: Array<{ term: string; status: string }> } | null

const TERM_LABEL: Record<string, string> = { FIRST: 'First', SECOND: 'Second', THIRD: 'Third' }
const TERMS = ['ALL', 'FIRST', 'SECOND', 'THIRD']

export function PortalDashboardClient({
  slug, me, reportCards, fees,
}: { slug: string; me: Me; reportCards: Card[]; fees: Fees }) {
  const [term, setTerm] = useState('ALL')
  const visible = term === 'ALL' ? reportCards : reportCards.filter((c) => c.term === term)

  return (
    <div className="space-y-10">
      <div className="animate-fade-up">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
          {me.school.name ?? 'Your school'}
        </p>
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Hi <span className="font-display-wonky italic text-primary">{me.student.firstName}.</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {me.student.className ? `${me.student.className} · ` : ''}Admission {me.student.admissionNumber}
          {me.currentSession
            ? ` · ${me.currentSession.name}, ${TERM_LABEL[me.currentSession.currentTerm] ?? me.currentSession.currentTerm} term`
            : ''}
        </p>
      </div>

      <section>
        <h2 className="font-display text-lg font-medium tracking-tight">Fees</h2>
        {fees && fees.session ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
            {fees.terms.map((t, i) => (
              <div key={t.term} className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                <span className="text-sm">
                  {TERM_LABEL[t.term] ?? t.term} term <span className="text-muted-foreground">· {fees.session?.name}</span>
                </span>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No fee records yet.</p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-medium tracking-tight">Report cards</h2>
          <div className="flex gap-1">
            {TERMS.map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${term === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {t === 'ALL' ? 'All' : TERM_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {reportCards.length === 0
              ? 'No published report cards yet. They appear here once your school releases them.'
              : 'No report cards for this term.'}
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
            {visible.map((c, i) => (
              <div key={c.id} className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${i > 0 ? 'border-t border-border' : ''}`}>
                <div>
                  <p className="font-display text-base font-medium tracking-tight">
                    {TERM_LABEL[c.term] ?? c.term} term
                    {c.session ? <span className="text-muted-foreground"> · {c.session.name}</span> : null}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {c.summary?.average != null ? `Average ${c.summary.average}` : 'Average —'}
                    {c.summary?.overallPosition != null ? ` · Position ${c.summary.overallPosition}${c.summary.classSize ? ` of ${c.summary.classSize}` : ''}` : ''}
                    {c.summary?.cumulativeAverage != null ? ` · Cumulative ${c.summary.cumulativeAverage}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/portal/${slug}/report-cards/${c.id}`}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    View
                  </Link>
                  {c.hasPdf && c.pdfUrl ? (
                    <a
                      href={c.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      PDF
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const paid = status === 'PAID'
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${paid ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600'}`}>
      {paid ? 'Paid' : 'Unpaid'}
    </span>
  )
}
