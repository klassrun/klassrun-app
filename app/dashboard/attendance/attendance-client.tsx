'use client'
// app/dashboard/attendance/attendance-client.tsx
// ops-2b-attendance-client
//
// Admin attendance entry grid. schoolOpened / present / absent per student per
// term. The server validates (present<=opened, absent<=opened). After entry,
// re-generate the class's report cards to fold these figures into each snapshot.

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

type ClassItem = { id: string; name: string; archivedAt: string | null }
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }
type GridRow = {
  // app-roster-states-v1: archivedAt arrives from the B2 roster. A student who has left
  // is still part of the session's record (spec 2.2) - shown, not hidden.
  student: { id: string; admissionNumber: string; firstName: string; lastName: string; middleName: string | null; archivedAt?: string | null }
  schoolOpened: number
  present: number
  absent: number
  hasEntry: boolean
}
type EditRow = GridRow & { saving: boolean; dirty: boolean }
type Field = 'schoolOpened' | 'present' | 'absent'

const TERMS: Array<{ value: 'FIRST' | 'SECOND' | 'THIRD'; label: string }> = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
]

export function AttendanceClient({ classes, sessions }: { classes: ClassItem[]; sessions: SessionItem[] }) {
  const currentSession = sessions.find((s) => s.isCurrent) ?? sessions[0] ?? null
  const [classId, setClassId] = useState<string>(classes[0]?.id ?? '')
  const [sessionId, setSessionId] = useState<string>(currentSession?.id ?? '')
  const [term, setTerm] = useState<'FIRST' | 'SECOND' | 'THIRD'>(currentSession?.currentTerm ?? 'FIRST')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [rows, setRows] = useState<EditRow[]>([])
  const [className, setClassName] = useState<string>('')
  // attendance-bulk-v1: one shared days-opened value, plus bulk-save progress.
  const [daysOpened, setDaysOpened] = useState<string>('')
  const [savingAll, setSavingAll] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const dirtyCount = rows.filter((r) => r.dirty).length

  async function loadGrid() {
    if (!classId) { toast.error('Pick a class'); return }
    if (!sessionId) { toast.error('Pick a session'); return }
    setLoading(true); setLoaded(false)
    const params = new URLSearchParams({ classId, sessionId, term })
    const res = await fetch(`/api/attendance/grid?${params.toString()}`, { cache: 'no-store' })
    setLoading(false)
    if (!res.ok) { const b = await res.json().catch(() => null); toast.error(b?.error?.message || 'Could not load roster'); return }
    const data = await res.json().catch(() => null)
    if (!data?.rows) { toast.error('Unexpected response'); return }
    const loadedRows: EditRow[] = (data.rows as GridRow[]).map((r) => ({ ...r, saving: false, dirty: false }))
    setRows(loadedRows)
    // attendance-bulk-v1: seed the shared box from whatever is already saved, so
    // re-opening a term you already entered does not show it blank.
    const alreadySet = loadedRows.find((r) => r.schoolOpened > 0)
    setDaysOpened(alreadySet ? String(alreadySet.schoolOpened) : '')
    setClassName(data.class?.name ?? classes.find((c) => c.id === classId)?.name ?? '')
    setLoaded(true)
  }

  function toInt(raw: string): number {
    const n = Math.floor(Number(raw))
    if (Number.isNaN(n) || n < 0) return 0
    return n
  }
  function setField(studentId: string, field: Field, raw: string) {
    setRows((prev) => prev.map((r) => (r.student.id === studentId ? { ...r, [field]: toInt(raw), dirty: true } : r)))
  }

  async function saveRow(studentId: string) {
    const row = rows.find((r) => r.student.id === studentId)
    if (!row) return
    if (row.present > row.schoolOpened) { toast.error('Present cannot exceed days opened'); return }
    if (row.absent > row.schoolOpened) { toast.error('Absent cannot exceed days opened'); return }
    setRows((prev) => prev.map((r) => (r.student.id === studentId ? { ...r, saving: true } : r)))
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, sessionId, term, schoolOpened: row.schoolOpened, present: row.present, absent: row.absent }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not save')
      setRows((prev) => prev.map((r) => (r.student.id === studentId ? { ...r, saving: false } : r)))
      return
    }
    setRows((prev) => prev.map((r) => (r.student.id === studentId ? { ...r, hasEntry: true, saving: false, dirty: false } : r)))
    toast.success('Saved')
  }

  // attendance-bulk-v1: "days the school opened" is a SCHOOL fact — the same number
  // for every student in the class. Typing it once per row was the bulk of the
  // work on this page. The per-row boxes stay for the student who joined or
  // left mid-term and genuinely has a different figure.
  function applyDaysOpenedToAll() {
    const n = toInt(daysOpened)
    if (!daysOpened.trim() || n <= 0) { toast.error('Enter the number of days the school opened'); return }
    setRows((prev) => prev.map((r) => (r.schoolOpened === n ? r : { ...r, schoolOpened: n, dirty: true })))
    toast.success(`Days opened set to ${n} for every student`)
  }

  // attendance-bulk-v1: the API saves one student at a time, so this loops.
  // SEQUENTIALLY on purpose — forty parallel POSTs would hammer the API.
  // A row that fails stays marked unsaved, so pressing Save all again retries
  // only the failures.
  async function saveAll() {
    const pending = rows.filter((r) => r.dirty)
    if (pending.length === 0) { toast.error('Nothing to save'); return }
    const invalid = pending.filter((r) => r.present > r.schoolOpened || r.absent > r.schoolOpened)
    if (invalid.length > 0) {
      toast.error(`${invalid.length} row${invalid.length === 1 ? ' has' : 's have'} present or absent above days opened. Fix those first.`)
      return
    }
    setSavingAll(true)
    setProgress({ done: 0, total: pending.length })
    const failed: string[] = []
    for (let i = 0; i < pending.length; i++) {
      const row = pending[i]
      try {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: row.student.id, sessionId, term, schoolOpened: row.schoolOpened, present: row.present, absent: row.absent }),
        })
        if (res.ok) {
          setRows((prev) => prev.map((r) => (r.student.id === row.student.id ? { ...r, hasEntry: true, dirty: false } : r)))
        } else {
          failed.push(`${row.student.lastName} ${row.student.firstName}`)
        }
      } catch {
        failed.push(`${row.student.lastName} ${row.student.firstName}`)
      }
      setProgress({ done: i + 1, total: pending.length })
    }
    setSavingAll(false)
    setProgress(null)
    if (failed.length === 0) {
      toast.success(`Saved ${pending.length} student${pending.length === 1 ? '' : 's'}`)
    } else {
      toast.error(`${failed.length} could not be saved: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '…' : ''}. Still marked unsaved — press Save all again to retry just those.`)
    }
  }

  return (
    <Shell>
      <div className="mt-10 rounded-xl border bg-card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-muted-foreground">Class
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setLoaded(false) }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
              {classes.length === 0 && <option value="">No classes</option>}
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">Session
            <select value={sessionId} onChange={(e) => { setSessionId(e.target.value); setLoaded(false) }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
              {sessions.length === 0 && <option value="">No sessions</option>}
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (current)' : ''}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">Term
            <select value={term} onChange={(e) => { setTerm(e.target.value as 'FIRST' | 'SECOND' | 'THIRD'); setLoaded(false) }} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
              {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={loadGrid} disabled={loading || !sessionId || !classId} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading ? 'Loading…' : 'Load roster'}
            </button>
          </div>
        </div>
      </div>

      {loaded && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{className} · {TERMS.find((t) => t.value === term)?.label}</h2>
          {/* attendance-bulk-v1 */}
          {rows.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-2">
                <label className="text-xs text-muted-foreground">Days the school opened
                  <input
                    type="number"
                    min={0}
                    value={daysOpened}
                    onChange={(e) => setDaysOpened(e.target.value)}
                    placeholder="e.g. 62"
                    className="mt-1 w-28 rounded-md border border-border bg-background px-2 py-2 text-center text-sm"
                  />
                </label>
                <button type="button" onClick={applyDaysOpenedToAll} disabled={savingAll} className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors">
                  Apply to all
                </button>
              </div>
              <div className="flex items-center gap-3">
                {dirtyCount > 0 && <span className="text-xs text-muted-foreground">{dirtyCount} unsaved</span>}
                <button type="button" onClick={saveAll} disabled={savingAll || dirtyCount === 0} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {savingAll && progress ? `Saving ${progress.done} of ${progress.total}…` : 'Save all'}
                </button>
              </div>
            </div>
          )}
          {rows.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              {/* app-roster-states-v1: an empty PAST session is correct, not broken. Saying
                  "add students first" there sends the admin to add people who
                  already exist. */}
              {sessions.find((s) => s.id === sessionId)?.isCurrent === false ? (
                <>
                  <p className="font-medium text-foreground">Nobody was enrolled in this class for this session.</p>
                  <p className="mx-auto mt-2 max-w-md">A student&apos;s class is recorded per session, so an earlier session shows only the students who were enrolled at the time. Nothing has been lost &mdash; switch to the current session for today&apos;s roster.</p>
                </>
              ) : (
                <>No students in this class yet. Add students on the <Link href="/dashboard/students" className="font-medium underline">Students</Link> page first.</>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-2 py-3 text-center font-medium">Days opened</th>
                  <th className="px-2 py-3 text-center font-medium">Present</th>
                  <th className="px-2 py-3 text-center font-medium">Absent</th>
                  <th className="px-3 py-3 text-right font-medium"></th>
                </tr></thead>
                <tbody className="divide-y">
                  {rows.map((r) => (
                    <tr key={r.student.id} className={r.student.archivedAt ? 'opacity-60 hover:bg-muted/20' : 'hover:bg-muted/20'}> {/* app-roster-states-v1 */}
                      <td className="px-4 py-2.5"><p className="font-medium leading-tight">{r.student.lastName} {r.student.firstName}{r.student.archivedAt ? <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground align-middle">Left</span> : null}</p><p className="font-mono text-[11px] text-muted-foreground">{r.student.admissionNumber}</p></td>
                      <td className="px-2 py-2.5 text-center"><input type="number" min={0} value={r.schoolOpened} onChange={(e) => setField(r.student.id, 'schoolOpened', e.target.value)} className="w-20 rounded-md border border-border bg-background px-2 py-1 text-center text-sm" /></td>
                      <td className="px-2 py-2.5 text-center"><input type="number" min={0} value={r.present} onChange={(e) => setField(r.student.id, 'present', e.target.value)} className="w-20 rounded-md border border-border bg-background px-2 py-1 text-center text-sm" /></td>
                      <td className="px-2 py-2.5 text-center"><input type="number" min={0} value={r.absent} onChange={(e) => setField(r.student.id, 'absent', e.target.value)} className="w-20 rounded-md border border-border bg-background px-2 py-1 text-center text-sm" /></td>
                      <td className="px-3 py-2.5 text-right"><button type="button" onClick={() => saveRow(r.student.id)} disabled={r.saving || savingAll} className={['rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50', r.dirty ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-border bg-background hover:bg-muted'].join(' ')}>{r.saving ? 'Saving…' : r.hasEntry && !r.dirty ? 'Saved' : 'Save'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">After entering attendance, re-generate the class&apos;s report cards to fold these figures into each card.</p>
        </section>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8"><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to dashboard</Link></div></header>
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">Operations</p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Attendance</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">Record termly attendance per student — days the school opened, days present, days absent.</p>
        {children}
      </div>
    </div>
  )
}
