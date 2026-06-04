'use client'
// app/dashboard/report-cards/comments/comments-client.tsx
// ops-2b-comments-client
//
// Admin AI report-card comments. Merges the class roster with existing comments.
// Per student: Generate (AI) / Regenerate / Edit→Save (manual PUT). Bulk
// "Generate for students without a comment" loops sequentially with progress and
// stops on a billing (402) error. After comments exist, re-generate the class's
// report cards so the snapshot/PDF pick them up.

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

type ClassItem = { id: string; name: string; archivedAt: string | null }
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }
type Student = { id: string; admissionNumber: string; firstName: string; lastName: string; middleName: string | null }
type Comment = { studentId: string; classTeacher: string | null; principal: string | null; source: string | null; aiGeneratedAt: string | null }
type Row = {
  student: Student
  classTeacher: string | null
  principal: string | null
  source: string | null
  hasComment: boolean
  busy: boolean
  editing: boolean
  draftCT: string
  draftPR: string
}

const TERMS: Array<{ value: 'FIRST' | 'SECOND' | 'THIRD'; label: string }> = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
]

export function CommentsClient({ classes, sessions }: { classes: ClassItem[]; sessions: SessionItem[] }) {
  const currentSession = sessions.find((s) => s.isCurrent) ?? sessions[0] ?? null
  const [classId, setClassId] = useState<string>(classes[0]?.id ?? '')
  const [sessionId, setSessionId] = useState<string>(currentSession?.id ?? '')
  const [term, setTerm] = useState<'FIRST' | 'SECOND' | 'THIRD'>(currentSession?.currentTerm ?? 'FIRST')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [bulk, setBulk] = useState<{ running: boolean; done: number; total: number }>({ running: false, done: 0, total: 0 })

  function patchRow(studentId: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.student.id === studentId ? { ...r, ...patch } : r)))
  }

  async function load() {
    if (!classId) { toast.error('Pick a class'); return }
    if (!sessionId) { toast.error('Pick a session'); return }
    setLoading(true); setLoaded(false)
    const cp = new URLSearchParams({ classId })
    const mp = new URLSearchParams({ classId, sessionId, term })
    const [stuRes, comRes] = await Promise.all([
      fetch(`/api/students?${cp.toString()}`, { cache: 'no-store' }),
      fetch(`/api/report-cards/comments?${mp.toString()}`, { cache: 'no-store' }),
    ])
    setLoading(false)
    if (!stuRes.ok) { const b = await stuRes.json().catch(() => null); toast.error(b?.error?.message || 'Could not load students'); return }
    const stuData = await stuRes.json().catch(() => null)
    const students: Student[] = stuData?.students ?? []
    const comData = comRes.ok ? await comRes.json().catch(() => null) : null
    const comments: Comment[] = comData?.comments ?? []
    const byStudent: Record<string, Comment> = {}
    comments.forEach((c) => { byStudent[c.studentId] = c })
    setRows(students.map((s) => {
      const c = byStudent[s.id]
      return {
        student: s,
        classTeacher: c?.classTeacher ?? null,
        principal: c?.principal ?? null,
        source: c?.source ?? null,
        hasComment: !!c && !!(c.classTeacher || c.principal),
        busy: false,
        editing: false,
        draftCT: c?.classTeacher ?? '',
        draftPR: c?.principal ?? '',
      }
    }))
    setLoaded(true)
  }

  // Returns 'ok' | 'gate' | 'error'
  async function generateOne(studentId: string): Promise<'ok' | 'gate' | 'error'> {
    patchRow(studentId, { busy: true })
    const res = await fetch('/api/report-cards/comments/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, sessionId, term }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      patchRow(studentId, { busy: false })
      if (res.status === 402) { toast.error(b?.error?.message || 'Trial ended — comments need an active plan'); return 'gate' }
      toast.error(b?.error?.message || 'Could not generate comment')
      return 'error'
    }
    const data = await res.json().catch(() => null)
    const c = data?.comment
    patchRow(studentId, {
      classTeacher: c?.classTeacher ?? null,
      principal: c?.principal ?? null,
      source: c?.source ?? 'ai',
      hasComment: !!(c?.classTeacher || c?.principal),
      draftCT: c?.classTeacher ?? '',
      draftPR: c?.principal ?? '',
      busy: false,
      editing: false,
    })
    return 'ok'
  }

  async function generateMissing() {
    const missing = rows.filter((r) => !r.hasComment)
    if (missing.length === 0) { toast.info('Every student already has a comment'); return }
    setBulk({ running: true, done: 0, total: missing.length })
    let done = 0
    for (const r of missing) {
      const status = await generateOne(r.student.id)
      done += 1
      setBulk({ running: true, done, total: missing.length })
      if (status === 'gate') break
    }
    setBulk({ running: false, done: 0, total: 0 })
    toast.success('Done generating')
  }

  async function saveEdit(studentId: string) {
    const row = rows.find((r) => r.student.id === studentId)
    if (!row) return
    patchRow(studentId, { busy: true })
    const res = await fetch('/api/report-cards/comments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, sessionId, term, classTeacher: row.draftCT, principal: row.draftPR }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not save comment')
      patchRow(studentId, { busy: false })
      return
    }
    const data = await res.json().catch(() => null)
    const c = data?.comment
    patchRow(studentId, {
      classTeacher: c?.classTeacher ?? (row.draftCT || null),
      principal: c?.principal ?? (row.draftPR || null),
      source: c?.source ?? 'edited',
      hasComment: !!(row.draftCT || row.draftPR),
      busy: false,
      editing: false,
    })
    toast.success('Saved')
  }

  const missingCount = rows.filter((r) => !r.hasComment).length

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8"><Link href="/dashboard/report-cards" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to report cards</Link></div></header>
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">Operations</p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Report-card comments</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">Generate class-teacher and principal comments with AI, grounded in each student&apos;s own results, attendance, and behaviour. Edit any comment before locking. Re-generate report cards afterwards to fold them in.</p>

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
              <button type="button" onClick={load} disabled={loading || !sessionId || !classId} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {loading ? 'Loading…' : 'Load class'}
              </button>
            </div>
          </div>
        </div>

        {loaded && (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {rows.length === 0 ? 'No students' : `${rows.length} student${rows.length === 1 ? '' : 's'} · ${missingCount} without a comment`}
              </h2>
              {rows.length > 0 && (
                <button type="button" onClick={generateMissing} disabled={bulk.running || missingCount === 0} className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {bulk.running ? `Generating ${bulk.done}/${bulk.total}…` : `Generate for ${missingCount} without a comment`}
                </button>
              )}
            </div>

            {rows.length === 0 ? (
              <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">No active students in this class. Add students on the <Link href="/dashboard/students" className="font-medium underline">Students</Link> page first.</div>
            ) : (
              <div className="space-y-4">
                {rows.map((r) => (
                  <div key={r.student.id} className="rounded-xl border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium leading-tight">{r.student.lastName} {r.student.firstName}{r.student.middleName ? ` ${r.student.middleName}` : ''}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{r.student.admissionNumber}{r.source ? ` · ${r.source}` : ''}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {!r.editing && (
                          <>
                            <button type="button" onClick={() => generateOne(r.student.id)} disabled={r.busy || bulk.running} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
                              {r.busy ? 'Working…' : r.hasComment ? 'Regenerate' : 'Generate'}
                            </button>
                            <button type="button" onClick={() => patchRow(r.student.id, { editing: true, draftCT: r.classTeacher ?? '', draftPR: r.principal ?? '' })} disabled={r.busy || bulk.running} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">Edit</button>
                          </>
                        )}
                      </div>
                    </div>

                    {r.editing ? (
                      <div className="mt-4 space-y-3">
                        <label className="block text-xs text-muted-foreground">Class teacher&apos;s comment
                          <textarea value={r.draftCT} onChange={(e) => patchRow(r.student.id, { draftCT: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                        </label>
                        <label className="block text-xs text-muted-foreground">Principal&apos;s comment
                          <textarea value={r.draftPR} onChange={(e) => patchRow(r.student.id, { draftPR: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                        </label>
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => patchRow(r.student.id, { editing: false })} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Cancel</button>
                          <button type="button" onClick={() => saveEdit(r.student.id)} disabled={r.busy} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">{r.busy ? 'Saving…' : 'Save'}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Class teacher</p>
                          <p className="mt-1 text-muted-foreground">{r.classTeacher ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Principal</p>
                          <p className="mt-1 text-muted-foreground">{r.principal ?? '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">Comments are saved as you generate or edit. Re-generate this class&apos;s report cards (Report cards → Generate) to bake them into each card before locking.</p>
          </section>
        )}
      </div>
    </div>
  )
}
