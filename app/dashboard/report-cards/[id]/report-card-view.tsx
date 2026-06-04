'use client'
// app/dashboard/report-cards/[id]/report-card-view.tsx
// ops-1b-reportcards-view
//
// Renders the frozen ReportCard.snapshot (computed once at generate-time on the
// server). Attendance / behaviour / comments render as "—" placeholders — that
// data lands in Ops 2. This view never recomputes anything.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

type SubjectRow = {
  subjectId: string
  name: string
  ca1: number
  ca2: number
  objective: number
  theory: number
  total: number
  grade: string
  remark: string
  subjectPosition: number | null
}
type Snapshot = {
  generatedAt: string
  student: {
    admissionNumber: string
    fullName: string
    photoUrl: string | null
    class: string
  }
  session: string
  term: 'FIRST' | 'SECOND' | 'THIRD'
  subjects: SubjectRow[]
  summary: {
    subjectsCount: number
    aggregate: number
    average: number
    overallPosition: number | null
    classSize: number
    cumulativeAverage: number | null
  }
  attendance: { schoolOpened: number | null; present: number | null; absent: number | null }
  behaviour: Array<{ attribute: string; score: number | null }>
  comments: { classTeacher: string | null; principal: string | null }
  resumptionDate: string | null
}
export type ReportCardRecord = {
  id: string
  term: 'FIRST' | 'SECOND' | 'THIRD'
  pdfUrl: string | null
  lockedAt: string | null
  snapshot: Snapshot
}

const TERM_LABEL: Record<string, string> = { FIRST: 'First Term', SECOND: 'Second Term', THIRD: 'Third Term' }
const ordinal = (n: number | null) => (n == null ? '—' : `${n}${['th', 'st', 'nd', 'rd'][(n % 100 - n % 10 === 10 ? 0 : n % 10)] || 'th'}`)

export function ReportCardView({ card }: { card: ReportCardRecord }) {
  const router = useRouter()
  const [pdfUrl, setPdfUrl] = useState<string | null>(card.pdfUrl)
  const [lockedAt, setLockedAt] = useState<string | null>(card.lockedAt)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [lockBusy, setLockBusy] = useState(false)
  const snap = card.snapshot
  const locked = !!lockedAt

  async function renderPdf() {
    setPdfBusy(true)
    const res = await fetch(`/api/report-cards/${card.id}/pdf`, { method: 'POST' })
    setPdfBusy(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not render PDF')
      return
    }
    const data = await res.json().catch(() => null)
    const url = data?.reportCard?.pdfUrl ?? null
    if (url) { setPdfUrl(url); toast.success('PDF ready'); window.open(url, '_blank') }
    router.refresh()
  }

  async function lockCard() {
    setLockBusy(true)
    const res = await fetch(`/api/report-cards/${card.id}/lock`, { method: 'POST' })
    setLockBusy(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not lock report card')
      return
    }
    const data = await res.json().catch(() => null)
    setLockedAt(data?.reportCard?.lockedAt ?? new Date().toISOString())
    toast.success('Report card locked')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard/report-cards" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to report cards</Link>
          <div className="flex items-center gap-2">
            {pdfUrl && <a href={pdfUrl} target="_blank" rel="noreferrer" className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Open PDF</a>}
            <button type="button" onClick={renderPdf} disabled={pdfBusy} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
              {pdfBusy ? 'Rendering…' : pdfUrl ? 'Re-render PDF' : 'Render PDF'}
            </button>
            <button type="button" onClick={lockCard} disabled={lockBusy || locked} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {locked ? 'Locked' : lockBusy ? 'Locking…' : 'Lock'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        {/* Student block */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {snap.student.photoUrl ? (
              <img src={snap.student.photoUrl.replace('/upload/', '/upload/w_144,h_144,c_fill,g_face,q_auto,f_auto/')} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-border bg-muted/30 text-[10px] uppercase text-muted-foreground">Photo</div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">Report card</p>
              <h1 className="font-display text-3xl font-medium leading-tight tracking-tight">{snap.student.fullName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-mono">{snap.student.admissionNumber}</span> · {snap.student.class} · {snap.session} · {TERM_LABEL[snap.term]}
              </p>
            </div>
          </div>
          {locked && <span className="self-start rounded-full bg-muted px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Locked</span>}
        </div>

        {/* Subjects table */}
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Subjects</h2>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-2 py-3 text-center font-medium">CA1</th>
                  <th className="px-2 py-3 text-center font-medium">CA2</th>
                  <th className="px-2 py-3 text-center font-medium">Obj</th>
                  <th className="px-2 py-3 text-center font-medium">Theory</th>
                  <th className="px-2 py-3 text-center font-medium">Total</th>
                  <th className="px-2 py-3 text-center font-medium">Grade</th>
                  <th className="px-2 py-3 text-center font-medium">Pos</th>
                  <th className="px-4 py-3 text-left font-medium">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {snap.subjects.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">No scores entered for this student yet.</td></tr>
                ) : snap.subjects.map((s) => (
                  <tr key={s.subjectId} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{s.name}</td>
                    <td className="px-2 py-2.5 text-center">{s.ca1}</td>
                    <td className="px-2 py-2.5 text-center">{s.ca2}</td>
                    <td className="px-2 py-2.5 text-center">{s.objective}</td>
                    <td className="px-2 py-2.5 text-center">{s.theory}</td>
                    <td className="px-2 py-2.5 text-center font-medium">{s.total}</td>
                    <td className="px-2 py-2.5 text-center"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{s.grade}</span></td>
                    <td className="px-2 py-2.5 text-center">{ordinal(s.subjectPosition)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{s.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Term summary */}
        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Subjects" value={String(snap.summary.subjectsCount)} />
          <Stat label="Average" value={String(snap.summary.average)} />
          <Stat label="Position" value={`${ordinal(snap.summary.overallPosition)} / ${snap.summary.classSize}`} />
          <Stat label="Cumulative avg" value={snap.summary.cumulativeAverage == null ? '—' : String(snap.summary.cumulativeAverage)} muted={snap.summary.cumulativeAverage == null} />
        </section>

        {/* Ops 2 placeholders */}
        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Attendance</h2>
            <div className="space-y-2 text-sm">
              <Row label="School opened" value={snap.attendance.schoolOpened ?? '—'} />
              <Row label="Present" value={snap.attendance.present ?? '—'} />
              <Row label="Absent" value={snap.attendance.absent ?? '—'} />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Attendance data arrives in a later update.</p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Behaviour</h2>
            <div className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
              {snap.behaviour.map((b) => (
                <div key={b.attribute} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{b.attribute}</span>
                  <span className="font-medium">{b.score ?? '—'}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Behavioural ratings arrive in a later update.</p>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Class teacher&apos;s comment</h2>
            <p className="text-sm text-muted-foreground">{snap.comments.classTeacher ?? '—'}</p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Principal&apos;s comment</h2>
            <p className="text-sm text-muted-foreground">{snap.comments.principal ?? '—'}</p>
          </div>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">
          Generated {new Date(snap.generatedAt).toLocaleString('en-GB')}. The PDF renders this exact snapshot.
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={['mt-2 font-display text-2xl font-medium leading-none tracking-tight', muted ? 'text-muted-foreground' : 'text-foreground'].join(' ')}>{value}</p>
    </div>
  )
}
function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
