// app/portal/[slug]/report-cards/[id]/report-card-view.tsx
// ops-5c-portal-reportcard-view
import Link from 'next/link'

type Subject = {
  name?: string; ca1?: number; ca2?: number; objective?: number; theory?: number
  total?: number; grade?: string; remark?: string; subjectPosition?: number | null
}
type Snapshot = {
  student?: { fullName?: string; admissionNumber?: string; class?: string }
  session?: string; term?: string
  subjects?: Subject[]
  summary?: { subjectsCount?: number; aggregate?: number; average?: number; overallPosition?: number; classSize?: number; cumulativeAverage?: number | null }
  attendance?: { schoolOpened?: number | null; present?: number | null; absent?: number | null }
  behaviour?: Array<{ attribute?: string; score?: number | null }>
  comments?: { classTeacher?: string | null; principal?: string | null }
  resumptionDate?: string | null
}
type Card = {
  id: string; term: string; session: { id: string; name: string } | null
  lockedAt: string | null; pdfUrl: string | null; hasPdf: boolean; snapshot: unknown
}

const TERM_LABEL: Record<string, string> = { FIRST: 'First', SECOND: 'Second', THIRD: 'Third' }
const dash = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v))

export function PortalReportCardView({ slug, card }: { slug: string; card: Card }) {
  const s = (card.snapshot ?? {}) as Snapshot
  const stu = s.student ?? {}
  const sum = s.summary ?? {}
  const att = s.attendance ?? {}
  const subjects = Array.isArray(s.subjects) ? s.subjects : []
  const behaviour = Array.isArray(s.behaviour) ? s.behaviour : []
  const comments = s.comments ?? {}

  return (
    <div className="space-y-8">
      <Link
        href={`/portal/${slug}/dashboard`}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to portal
      </Link>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
          {dash(s.session)} · {TERM_LABEL[s.term ?? ''] ?? dash(s.term)} term
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight">{dash(stu.fullName)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Admission {dash(stu.admissionNumber)} · {dash(stu.class)}</p>
        {card.hasPdf && card.pdfUrl ? (
          <a
            href={card.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Download PDF
          </a>
        ) : null}
      </div>

      <section>
        <h2 className="font-display text-lg font-medium tracking-tight">Results</h2>
        {subjects.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No subject results in this report.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[560px] text-sm tabular-nums">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Subject</th>
                  <th className="px-3 py-2.5 text-center font-medium">CA1</th>
                  <th className="px-3 py-2.5 text-center font-medium">CA2</th>
                  <th className="px-3 py-2.5 text-center font-medium">Obj</th>
                  <th className="px-3 py-2.5 text-center font-medium">Theory</th>
                  <th className="px-3 py-2.5 text-center font-medium">Total</th>
                  <th className="px-3 py-2.5 text-center font-medium">Grade</th>
                  <th className="px-3 py-2.5 text-center font-medium">Pos</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, i) => (
                  <tr key={i} className={i > 0 ? 'border-t border-border' : ''}>
                    <td className="px-4 py-2.5 font-medium">{dash(sub.name)}</td>
                    <td className="px-3 py-2.5 text-center">{dash(sub.ca1)}</td>
                    <td className="px-3 py-2.5 text-center">{dash(sub.ca2)}</td>
                    <td className="px-3 py-2.5 text-center">{dash(sub.objective)}</td>
                    <td className="px-3 py-2.5 text-center">{dash(sub.theory)}</td>
                    <td className="px-3 py-2.5 text-center font-medium">{dash(sub.total)}</td>
                    <td className="px-3 py-2.5 text-center">{dash(sub.grade)}</td>
                    <td className="px-3 py-2.5 text-center">{dash(sub.subjectPosition)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Average" value={dash(sum.average)} />
        <Stat label="Position" value={sum.overallPosition != null ? `${sum.overallPosition}${sum.classSize ? ` / ${sum.classSize}` : ''}` : '—'} />
        <Stat label="Aggregate" value={dash(sum.aggregate)} />
        <Stat label="Cumulative" value={dash(sum.cumulativeAverage)} />
      </section>

      <section>
        <h2 className="font-display text-lg font-medium tracking-tight">Attendance</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="School opened" value={dash(att.schoolOpened)} />
          <Stat label="Present" value={dash(att.present)} />
          <Stat label="Absent" value={dash(att.absent)} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium tracking-tight">
          Behaviour <span className="text-sm font-normal text-muted-foreground">(1–5)</span>
        </h2>
        {behaviour.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No behaviour ratings in this report.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-5 py-4 sm:grid-cols-3">
            {behaviour.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{dash(b.attribute)}</span>
                <span className="font-medium tabular-nums">{dash(b.score)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-display text-base font-medium tracking-tight">Class teacher&apos;s comment</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{dash(comments.classTeacher)}</p>
        </div>
        <div>
          <h3 className="font-display text-base font-medium tracking-tight">Principal&apos;s comment</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{dash(comments.principal)}</p>
        </div>
        <p className="text-xs text-muted-foreground">Resumption date: {dash(s.resumptionDate)}</p>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-medium tabular-nums">{value}</p>
    </div>
  )
}
