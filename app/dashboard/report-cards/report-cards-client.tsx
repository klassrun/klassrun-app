'use client'
// app/dashboard/report-cards/report-cards-client.tsx
// ops-1b-reportcards-client

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { ReportCardListItem } from './page'

type ClassItem = { id: string; name: string; archivedAt: string | null }
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }

const TERMS: Array<{ value: 'FIRST' | 'SECOND' | 'THIRD'; label: string }> = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
]
const TERM_LABEL: Record<string, string> = { FIRST: 'First Term', SECOND: 'Second Term', THIRD: 'Third Term' }

export function ReportCardsClient({
  classes,
  sessions,
  initialCards,
}: {
  classes: ClassItem[]
  sessions: SessionItem[]
  initialCards: ReportCardListItem[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const currentSession = sessions.find((s) => s.isCurrent) ?? sessions[0] ?? null

  const [classId, setClassId] = useState<string>(classes[0]?.id ?? '')
  const [sessionId, setSessionId] = useState<string>(currentSession?.id ?? '')
  const [term, setTerm] = useState<'FIRST' | 'SECOND' | 'THIRD'>(currentSession?.currentTerm ?? 'FIRST')
  const [generating, setGenerating] = useState(false)
  const [cards, setCards] = useState<ReportCardListItem[]>(initialCards)

  async function reloadList() {
    const res = await fetch('/api/report-cards', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json().catch(() => null)
    if (data?.reportCards) setCards(data.reportCards)
  }

  async function generate() {
    if (!classId) { toast.error('Pick a class'); return }
    if (!sessionId) { toast.error('Pick a session'); return }
    setGenerating(true)
    const res = await fetch('/api/report-cards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, sessionId, term }),
    })
    setGenerating(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not generate report cards')
      return
    }
    const data = await res.json().catch(() => null)
    toast.success(`Generated ${data?.count ?? 0} report card${data?.count === 1 ? '' : 's'}`)
    await reloadList()
    startTransition(() => router.refresh())
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">Operations</p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Report cards</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Generate Nigerian-format report cards for a class, term by term. Positions and grades are computed from entered scores.
        </p>

        <div className="mt-10 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Generate</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-muted-foreground">
              Class
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                {classes.length === 0 && <option value="">No classes</option>}
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Session
              <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                {sessions.length === 0 && <option value="">No sessions</option>}
                {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (current)' : ''}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Term
              <select value={term} onChange={(e) => setTerm(e.target.value as 'FIRST' | 'SECOND' | 'THIRD')} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <button type="button" onClick={generate} disabled={generating || !classId || !sessionId} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {generating ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Regenerating overwrites the snapshot for that class &amp; term. Locked cards are protected.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {cards.length === 0 ? 'No report cards yet' : cards.length === 1 ? '1 report card' : `${cards.length} report cards`}
          </h2>
          {cards.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Generate a class above to see report cards here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card divide-y">
              {cards.map((c) => (
                <Link key={c.id} href={`/dashboard/report-cards/${c.id}`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.student.lastName} {c.student.firstName}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{c.student.admissionNumber}</span> · {c.session.name} · {TERM_LABEL[c.term]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    {c.summary && (
                      <span>Avg {c.summary.average} · Pos {c.summary.overallPosition ?? '—'}/{c.summary.classSize}</span>
                    )}
                    {c.lockedAt && <span className="rounded-full bg-muted px-2 py-0.5 font-medium uppercase tracking-wider">Locked</span>}
                    {c.pdfUrl && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">PDF</span>}
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
