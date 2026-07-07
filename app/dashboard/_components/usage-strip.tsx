// app/dashboard/_components/usage-strip.tsx
// batch-6-usage-strip
//
// Enriched dashboard stats strip for SCHOOL_ADMIN: teacher count + AI usage
// (notes / schemes / exams) + estimated hours saved, with a subscribe nudge.
// Un-gated conversion widget. Degrades to teacher-count-only if usage is null.

import Link from 'next/link'

export type UsageData = {
  allTime: { notes: number; schemes: number; uploadedSchemes: number; exams: number }
  thisTerm: { notes: number; schemes: number; exams: number }
  hoursSaved: { allTime: number; thisTerm: number }
  teacherCount: number
  currentSession: { name: string; term: string } | null
} | null

export function UsageStrip({
  usage,
  teacherCount,
  showSubscribe,
}: {
  usage: UsageData
  teacherCount: number
  showSubscribe?: boolean
}) {
  if (!usage) {
    return (
      <div className="mb-10 flex items-baseline gap-3">
        <span className="font-display text-4xl font-medium text-primary">{teacherCount}</span>
        <span className="text-sm text-muted-foreground">
          {teacherCount === 0
            ? 'teachers — invite your first below'
            : teacherCount === 1
            ? 'teacher on board'
            : 'teachers on board'}
        </span>
      </div>
    )
  }

  const t = usage.thisTerm
  const totalThisTerm = t.notes + t.schemes + t.exams
  const hours = usage.hoursSaved.thisTerm

  return (
    <div className="mb-10">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
        <Stat value={usage.teacherCount} label={usage.teacherCount === 1 ? 'teacher' : 'teachers'} />
        <Stat value={t.notes} label={t.notes === 1 ? 'lesson note' : 'lesson notes'} />
        <Stat value={t.schemes} label={t.schemes === 1 ? 'scheme' : 'schemes'} />
        <Stat value={t.exams} label={t.exams === 1 ? 'exam' : 'exams'} />
      </div>

      {totalThisTerm > 0 && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border bg-accent/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-foreground">
            Your teachers have generated{' '}
            <span className="font-medium">{totalThisTerm}</span>{' '}
            {totalThisTerm === 1 ? 'item' : 'items'}
            {usage.currentSession ? <> this {usage.currentSession.term.toLowerCase()}</> : null}
            {' '}— roughly{' '}
            <span className="font-medium text-primary">{hours} {hours === 1 ? 'hour' : 'hours'}</span>{' '}
            saved.
          </p>
          {showSubscribe && (
            <Link
              href="/dashboard/billing"
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
            >
              Subscribe to keep it
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-card px-5 py-4">
      <span className="font-display text-3xl font-medium text-primary">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
