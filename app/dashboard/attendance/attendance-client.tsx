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
  student: { id: string; admissionNumber: string; firstName: string; lastName: string; middleName: string | null }
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
    setRows((data.rows as GridRow[]).map((r) => ({ ...r, saving: false, dirty: false })))
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
          {rows.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">No active students in this class. Add students on the <Link href="/dashboard/students" className="font-medium underline">Students</Link> page first.</div>
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
                    <tr key={r.student.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5"><p className="font-medium leading-tight">{r.student.lastName} {r.student.firstName}</p><p className="font-mono text-[11px] text-muted-foreground">{r.student.admissionNumber}</p></td>
                      <td className="px-2 py-2.5 text-center"><input type="number" min={0} value={r.schoolOpened} onChange={(e) => setField(r.student.id, 'schoolOpened', e.target.value)} className="w-20 rounded-md border border-border bg-background px-2 py-1 text-center text-sm" /></td>
                      <td className="px-2 py-2.5 text-center"><input type="number" min={0} value={r.present} onChange={(e) => setField(r.student.id, 'present', e.target.value)} className="w-20 rounded-md border border-border bg-background px-2 py-1 text-center text-sm" /></td>
                      <td className="px-2 py-2.5 text-center"><input type="number" min={0} value={r.absent} onChange={(e) => setField(r.student.id, 'absent', e.target.value)} className="w-20 rounded-md border border-border bg-background px-2 py-1 text-center text-sm" /></td>
                      <td className="px-3 py-2.5 text-right"><button type="button" onClick={() => saveRow(r.student.id)} disabled={r.saving} className={['rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50', r.dirty ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-border bg-background hover:bg-muted'].join(' ')}>{r.saving ? 'Saving…' : r.hasEntry && !r.dirty ? 'Saved' : 'Save'}</button></td>
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
