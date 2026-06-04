'use client'
// app/dashboard/results/results-client.tsx
// ops-1b-results-client
//
// Teacher score-entry grid. Grades/totals are DISPLAY-ONLY from the server
// (grading.js is the single source of truth) — we never recompute them here.
// scoreMax (returned by /api/results/grid) drives input clamping hints only.

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { SubjectPair } from './page'

type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }
type ScoreMax = { ca1: number; ca2: number; objective: number; theory: number }
type GridRow = {
  student: { id: string; admissionNumber: string; firstName: string; lastName: string; middleName: string | null }
  ca1: number
  ca2: number
  objective: number
  theory: number
  total: number | null
  grade: string | null
  hasEntry: boolean
}
type EditRow = GridRow & { saving: boolean; dirty: boolean }

const TERMS: Array<{ value: 'FIRST' | 'SECOND' | 'THIRD'; label: string }> = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
]
const COMPONENTS: Array<keyof ScoreMax> = ['ca1', 'ca2', 'objective', 'theory']
const COMPONENT_LABEL: Record<keyof ScoreMax, string> = { ca1: 'CA1', ca2: 'CA2', objective: 'Obj', theory: 'Theory' }

export function ResultsClient({ pairs, sessions }: { pairs: SubjectPair[]; sessions: SessionItem[] }) {
  const currentSession = sessions.find((s) => s.isCurrent) ?? sessions[0] ?? null
  const [pairKey, setPairKey] = useState<string>(pairs[0] ? `${pairs[0].classId}::${pairs[0].subjectId}` : '')
  const [sessionId, setSessionId] = useState<string>(currentSession?.id ?? '')
  const [term, setTerm] = useState<'FIRST' | 'SECOND' | 'THIRD'>(currentSession?.currentTerm ?? 'FIRST')

  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [scoreMax, setScoreMax] = useState<ScoreMax | null>(null)
  const [rows, setRows] = useState<EditRow[]>([])
  const [meta, setMeta] = useState<{ subjectName: string; className: string } | null>(null)

  const selectedPair = pairs.find((p) => `${p.classId}::${p.subjectId}` === pairKey) ?? null

  async function loadGrid() {
    if (!selectedPair) { toast.error('Pick a subject'); return }
    if (!sessionId) { toast.error('Pick a session'); return }
    setLoading(true)
    setLoaded(false)
    const params = new URLSearchParams({
      classId: selectedPair.classId,
      subjectId: selectedPair.subjectId,
      sessionId,
      term,
    })
    const res = await fetch(`/api/results/grid?${params.toString()}`, { cache: 'no-store' })
    setLoading(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not load roster')
      return
    }
    const data = await res.json().catch(() => null)
    if (!data?.rows) { toast.error('Unexpected response'); return }
    setScoreMax(data.scoreMax ?? null)
    setRows((data.rows as GridRow[]).map((r) => ({ ...r, saving: false, dirty: false })))
    setMeta({ subjectName: selectedPair.subjectName, className: selectedPair.className })
    setLoaded(true)
  }

  function clampValue(field: keyof ScoreMax, raw: string): number {
    const max = scoreMax ? scoreMax[field] : 100
    const n = Math.floor(Number(raw))
    if (Number.isNaN(n) || n < 0) return 0
    if (n > max) return max
    return n
  }

  function setField(studentId: string, field: keyof ScoreMax, raw: string) {
    setRows((prev) => prev.map((r) => {
      if (r.student.id !== studentId) return r
      return { ...r, [field]: clampValue(field, raw), dirty: true }
    }))
  }

  async function saveRow(studentId: string) {
    if (!selectedPair) return
    const row = rows.find((r) => r.student.id === studentId)
    if (!row) return
    setRows((prev) => prev.map((r) => (r.student.id === studentId ? { ...r, saving: true } : r)))
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        term,
        subjectId: selectedPair.subjectId,
        sessionId,
        studentId,
        ca1: row.ca1,
        ca2: row.ca2,
        objective: row.objective,
        theory: row.theory,
      }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not save score')
      setRows((prev) => prev.map((r) => (r.student.id === studentId ? { ...r, saving: false } : r)))
      return
    }
    const data = await res.json().catch(() => null)
    const result = data?.result
    setRows((prev) => prev.map((r) => {
      if (r.student.id !== studentId) return r
      return {
        ...r,
        total: result ? result.total : r.total,
        grade: result ? result.grade : r.grade,
        hasEntry: true,
        saving: false,
        dirty: false,
      }
    }))
    toast.success('Saved')
  }

  if (pairs.length === 0) {
    return (
      <Shell>
        <div className="mt-10 rounded-xl border border-dashed bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">You haven&apos;t been assigned to any subjects yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Ask your school admin to assign you, then come back to enter scores.</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mt-10 rounded-xl border bg-card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-muted-foreground">
            Subject
            <select value={pairKey} onChange={(e) => { setPairKey(e.target.value); setLoaded(false) }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
              {pairs.map((p) => (
                <option key={`${p.classId}::${p.subjectId}`} value={`${p.classId}::${p.subjectId}`}>
                  {p.className} · {p.subjectName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Session
            <select value={sessionId} onChange={(e) => { setSessionId(e.target.value); setLoaded(false) }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
              {sessions.length === 0 && <option value="">No sessions</option>}
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (current)' : ''}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Term
            <select value={term} onChange={(e) => { setTerm(e.target.value as 'FIRST' | 'SECOND' | 'THIRD'); setLoaded(false) }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
              {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={loadGrid} disabled={loading || !sessionId} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading ? 'Loading…' : 'Load roster'}
            </button>
          </div>
        </div>
      </div>

      {loaded && meta && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {meta.className} · {meta.subjectName} · {TERMS.find((t) => t.value === term)?.label}
          </h2>

          {rows.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No active students in this class. Add students on the{' '}
              <Link href="/dashboard/students" className="font-medium underline">Students</Link> page first.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Student</th>
                    {COMPONENTS.map((c) => (
                      <th key={c} className="px-2 py-3 text-center font-medium">
                        {COMPONENT_LABEL[c]}{scoreMax ? <span className="block text-[9px] normal-case text-muted-foreground/70">/{scoreMax[c]}</span> : null}
                      </th>
                    ))}
                    <th className="px-2 py-3 text-center font-medium">Total</th>
                    <th className="px-2 py-3 text-center font-medium">Grade</th>
                    <th className="px-3 py-3 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r) => (
                    <tr key={r.student.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <p className="font-medium leading-tight">{r.student.lastName} {r.student.firstName}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{r.student.admissionNumber}</p>
                      </td>
                      {COMPONENTS.map((c) => (
                        <td key={c} className="px-2 py-2.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={scoreMax ? scoreMax[c] : 100}
                            value={r[c]}
                            onChange={(e) => setField(r.student.id, c, e.target.value)}
                            className="w-16 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2.5 text-center font-medium">{r.total ?? '—'}</td>
                      <td className="px-2 py-2.5 text-center">
                        {r.grade ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r.grade}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => saveRow(r.student.id)}
                          disabled={r.saving}
                          className={[
                            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                            r.dirty ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-border bg-background hover:bg-muted',
                          ].join(' ')}
                        >
                          {r.saving ? 'Saving…' : r.hasEntry && !r.dirty ? 'Saved' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Totals and grades are computed by Klassrun when you save — they reflect the school grading scale, not the numbers in the boxes.
          </p>
        </section>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to dashboard</Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">Results</p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Record scores</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Enter CA &amp; exam scores for your assigned subjects. Pick a subject, session, and term, then load the roster.
        </p>
        {children}
      </div>
    </div>
  )
}
