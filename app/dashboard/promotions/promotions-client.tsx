'use client'
// app/dashboard/promotions/promotions-client.tsx
// ops-3b-promotions-client
//
// Admin promotion. Pick source + target class + session + term + a minimum-average
// threshold, Load eligibility (server computes each student's cumulative average
// across the session's terms with results, plus a PROMOTE/RETAIN suggestion),
// override per student if needed, then Execute. Execution is a server-side
// transaction that writes one PromotionRecord per student and moves classId for
// promotions. History below; each record is reversible. Display-only — the
// server is authoritative for cumulative + suggestions.

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

type ClassItem = { id: string; name: string; level: string | null; archivedAt: string | null }
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }
type TermAverage = { term: string; average: number; subjectsCount: number }
type StudentBrief = { id: string; admissionNumber: string; firstName: string; middleName: string | null; lastName: string }
type EligibilityRow = {
  student: StudentBrief
  termAverages: TermAverage[]
  cumulative: number | null
  subjectsCount: number
  suggestion: 'PROMOTE' | 'RETAIN' | 'NO_RESULTS'
  alreadyPromoted: boolean
  existingRecordId: string | null
}
type Verb = 'PROMOTE' | 'RETAIN'
type HistoryItem = {
  id: string
  decision: string
  cumulative: number | null
  threshold: number | null
  uptoTerm: string
  student: StudentBrief
  fromClass: { id: string; name: string } | null
  toClass: { id: string; name: string } | null
  session: { id: string; name: string } | null
  reversedAt: string | null
  createdAt: string
}

const TERMS: Array<{ value: 'FIRST' | 'SECOND' | 'THIRD'; label: string }> = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
]
const TERM_SHORT: Record<string, string> = { FIRST: '1st', SECOND: '2nd', THIRD: '3rd' }

function fullName(s: StudentBrief): string {
  return `${s.lastName} ${s.firstName}${s.middleName ? ` ${s.middleName}` : ''}`
}

export function PromotionsClient({ classes, sessions }: { classes: ClassItem[]; sessions: SessionItem[] }) {
  const activeClasses = classes.filter((c) => !c.archivedAt)
  const currentSession = sessions.find((s) => s.isCurrent) ?? (sessions[0] ?? null)

  const [sourceClassId, setSourceClassId] = useState<string>(activeClasses[0]?.id ?? '')
  const [targetClassId, setTargetClassId] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>(currentSession?.id ?? '')
  const [term, setTerm] = useState<'FIRST' | 'SECOND' | 'THIRD'>(currentSession?.currentTerm ?? 'THIRD')
  const [threshold, setThreshold] = useState<string>('50')

  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [rows, setRows] = useState<EligibilityRow[]>([])
  const [decisions, setDecisions] = useState<Record<string, Verb>>({})
  const [executing, setExecuting] = useState(false)

  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  function invalidate() { setLoaded(false) }

  async function load() {
    if (!sourceClassId) { toast.error('Pick a source class'); return }
    if (!sessionId) { toast.error('Pick a session'); return }
    const th = Number(threshold)
    if (!Number.isFinite(th) || th < 0 || th > 100) { toast.error('Threshold must be 0–100'); return }

    setLoading(true); setLoaded(false)
    const qp = new URLSearchParams({ classId: sourceClassId, sessionId, term, threshold: String(th) })
    const res = await fetch(`/api/promotions/eligibility?${qp.toString()}`, { cache: 'no-store' })
    setLoading(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not load eligibility')
      return
    }
    const data = await res.json().catch(() => null)
    const list: EligibilityRow[] = data?.rows ?? []
    setRows(list)
    const init: Record<string, Verb> = {}
    list.forEach((r) => { init[r.student.id] = r.suggestion === 'PROMOTE' ? 'PROMOTE' : 'RETAIN' })
    setDecisions(init)
    setLoaded(true)
    await loadHistory()
  }

  function setDecision(studentId: string, verb: Verb) {
    setDecisions((prev) => ({ ...prev, [studentId]: verb }))
  }
  function applySuggestions() {
    const next: Record<string, Verb> = {}
    rows.forEach((r) => { next[r.student.id] = r.suggestion === 'PROMOTE' ? 'PROMOTE' : 'RETAIN' })
    setDecisions(next)
    toast.success('Reset to suggestions')
  }

  const selectable = rows.filter((r) => !r.alreadyPromoted)
  const promoteCount = selectable.filter((r) => decisions[r.student.id] === 'PROMOTE').length
  const retainCount = selectable.filter((r) => decisions[r.student.id] === 'RETAIN').length

  async function execute() {
    if (!targetClassId) { toast.error('Pick a target class'); return }
    if (targetClassId === sourceClassId) { toast.error('Target class must differ from source'); return }
    if (selectable.length === 0) { toast.error('No students to promote (all already have a record)'); return }

    const payloadDecisions = selectable.map((r) => ({
      studentId: r.student.id,
      decision: decisions[r.student.id] ?? 'RETAIN',
    }))

    setExecuting(true)
    const res = await fetch('/api/promotions/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceClassId,
        targetClassId,
        sessionId,
        term,
        threshold: Number(threshold),
        decisions: payloadDecisions,
      }),
    })
    setExecuting(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not execute promotion')
      return
    }
    const data = await res.json().catch(() => null)
    const ex = data?.executed ?? { promoted: 0, retained: 0, skipped: 0 }
    toast.success(`Promoted ${ex.promoted}, retained ${ex.retained}${ex.skipped ? `, skipped ${ex.skipped}` : ''}`)
    await load()
  }

  async function loadHistory() {
    if (!sessionId) return
    setHistoryLoading(true)
    const qp = new URLSearchParams({ sessionId })
    const res = await fetch(`/api/promotions?${qp.toString()}`, { cache: 'no-store' })
    setHistoryLoading(false)
    if (!res.ok) return
    const data = await res.json().catch(() => null)
    setHistory(data?.promotions ?? [])
  }

  async function reverse(id: string) {
    const res = await fetch(`/api/promotions/${id}/reverse`, { method: 'POST' })
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not reverse')
      return
    }
    toast.success('Reversed')
    await load()
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
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Promotion</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Move a class up at the end of a session. Eligibility is based on each student&apos;s cumulative average across the terms that have results. Review the suggestion, adjust per student, then promote into the class you choose. Every promotion is reversible.
        </p>

        <div className="mt-10 rounded-xl border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs text-muted-foreground">Source class
              <select value={sourceClassId} onChange={(e) => { setSourceClassId(e.target.value); invalidate() }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                {activeClasses.length === 0 && <option value="">No classes</option>}
                {activeClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">Target class (promote into)
              <select value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                <option value="">Choose…</option>
                {activeClasses.filter((c) => c.id !== sourceClassId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">Session
              <select value={sessionId} onChange={(e) => { setSessionId(e.target.value); invalidate() }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                {sessions.length === 0 && <option value="">No sessions</option>}
                {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (current)' : ''}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">Up to term
              <select value={term} onChange={(e) => { setTerm(e.target.value as 'FIRST' | 'SECOND' | 'THIRD'); invalidate() }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">Pass mark (min average)
              <input type="number" min={0} max={100} value={threshold} onChange={(e) => { setThreshold(e.target.value); invalidate() }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground" />
            </label>
            <div className="flex items-end">
              <button type="button" onClick={load} disabled={loading || !sourceClassId || !sessionId} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {loading ? 'Loading…' : 'Load eligibility'}
              </button>
            </div>
          </div>
        </div>

        {loaded && (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {rows.length === 0 ? 'No students' : `${rows.length} student${rows.length === 1 ? '' : 's'} · ${promoteCount} to promote · ${retainCount} to retain`}
              </h2>
              {rows.length > 0 && (
                <button type="button" onClick={applySuggestions} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Reset to suggestions</button>
              )}
            </div>

            {rows.length === 0 ? (
              <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
                No active students in this class. Add students on the <Link href="/dashboard/students" className="font-medium underline">Students</Link> page first.
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border bg-card divide-y">
                  {rows.map((r) => {
                    const verb = decisions[r.student.id] ?? 'RETAIN'
                    return (
                      <div key={r.student.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium leading-tight">{fullName(r.student)}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {r.student.admissionNumber}
                            {r.termAverages.length > 0 ? ` · ${r.termAverages.map((t) => `${TERM_SHORT[t.term] ?? t.term} ${t.average}`).join(' · ')}` : ' · no results'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cumulative</p>
                            <p className="font-display text-lg font-medium">{r.cumulative === null ? '—' : r.cumulative}</p>
                          </div>
                          {r.alreadyPromoted ? (
                            <span className="rounded-md border border-amber-300/60 bg-amber-50/60 px-3 py-1.5 text-xs font-medium text-amber-700">Already decided</span>
                          ) : (
                            <div className="inline-flex overflow-hidden rounded-md border border-border">
                              <button type="button" onClick={() => setDecision(r.student.id, 'PROMOTE')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${verb === 'PROMOTE' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>Promote</button>
                              <button type="button" onClick={() => setDecision(r.student.id, 'RETAIN')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${verb === 'RETAIN' ? 'bg-foreground text-background' : 'bg-background hover:bg-muted'}`}>Retain</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-5 py-4">
                  <p className="text-sm text-muted-foreground">
                    {targetClassId ? <>Promoting into <span className="font-medium text-foreground">{activeClasses.find((c) => c.id === targetClassId)?.name}</span>.</> : 'Choose a target class above to enable promotion.'}
                  </p>
                  <button type="button" onClick={execute} disabled={executing || !targetClassId || selectable.length === 0} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {executing ? 'Working…' : `Execute (${promoteCount} promote, ${retainCount} retain)`}
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Promotion history{sessionId ? ' · this session' : ''}</h2>
            <button type="button" onClick={loadHistory} disabled={historyLoading || !sessionId} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
              {historyLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No promotion records yet for this session.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card divide-y">
              {history.map((h) => (
                <div key={h.id} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 ${h.reversedAt ? 'opacity-60' : ''}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{fullName(h.student)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      <span className={h.decision === 'PROMOTED' ? 'text-primary' : ''}>{h.decision === 'PROMOTED' ? 'Promoted' : 'Retained'}</span>
                      {h.fromClass ? ` · ${h.fromClass.name}` : ''}{h.toClass ? ` → ${h.toClass.name}` : ''}
                      {h.cumulative === null ? '' : ` · avg ${h.cumulative}`}
                      {h.reversedAt ? ' · reversed' : ''}
                    </p>
                  </div>
                  {!h.reversedAt && (
                    <button type="button" onClick={() => reverse(h.id)} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Reverse</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
