'use client'
// app/dashboard/fees/fees-client.tsx
// ops-4b-fees-client

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type ClassOpt = { id: string; name: string }
type SessionOpt = { id: string; name: string; currentTerm: string; isCurrent: boolean }
type Row = { id: string; admissionNumber: string; firstName: string; lastName: string; status: 'PAID' | 'UNPAID' }
type Summary = { total: number; paid: number; unpaid: number; percentPaid: number }

const TERMS = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
]

export function FeesClient({ classes, sessions }: { classes: ClassOpt[]; sessions: SessionOpt[] }) {
  const currentSession = sessions.find((s) => s.isCurrent) ?? (sessions.length > 0 ? sessions[0] : null)
  const [classId, setClassId] = useState('')
  const [sessionId, setSessionId] = useState(currentSession?.id ?? '')
  const [term, setTerm] = useState<string>(currentSession?.currentTerm ?? 'FIRST')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  function reset() {
    setRows(null)
    setSummary(null)
  }

  function onSessionChange(id: string) {
    setSessionId(id)
    const s = sessions.find((x) => x.id === id)
    if (s) setTerm(s.currentTerm)
    reset()
  }

  function queryString() {
    return new URLSearchParams({ classId, sessionId, term }).toString()
  }

  async function load() {
    if (!classId || !sessionId || !term) {
      toast.error('Pick a class, session and term first')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/fees?${queryString()}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not load fees')
        return
      }
      setRows(data.students ?? [])
      setSummary(data.summary ?? null)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function refresh() {
    try {
      const res = await fetch(`/api/fees?${queryString()}`)
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setRows(data.students ?? [])
        setSummary(data.summary ?? null)
      }
    } catch {
      /* keep current view on transient error */
    }
  }

  async function toggle(row: Row) {
    const next = row.status === 'PAID' ? 'UNPAID' : 'PAID'
    setBusyId(row.id)
    try {
      const res = await fetch('/api/fees/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: row.id, sessionId, term, status: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not update')
        return
      }
      await refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function bulk(status: 'PAID' | 'UNPAID') {
    if (!rows || rows.length === 0) return
    const label = status === 'PAID' ? 'paid' : 'unpaid'
    if (!confirm(`Mark all ${rows.length} student(s) ${label} for this term?`)) return
    setBulkBusy(true)
    try {
      const res = await fetch('/api/fees/bulk-mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, sessionId, term, status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not bulk update')
        return
      }
      toast.success(`Marked ${data.marked ?? 0} student(s) ${label}`)
      await refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setBulkBusy(false)
    }
  }

  const selectCls = 'rounded-lg border border-border bg-background px-3 py-2 text-sm'
  const noRows = !rows || rows.length === 0

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Class</label>
          <select className={selectCls} value={classId} onChange={(e) => { setClassId(e.target.value); reset() }}>
            <option value="">Select a class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Session</label>
          <select className={selectCls} value={sessionId} onChange={(e) => onSessionChange(e.target.value)}>
            <option value="">Select a session…</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (current)' : ''}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Term</label>
          <select className={selectCls} value={term} onChange={(e) => { setTerm(e.target.value); reset() }}>
            {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <Button onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Load fees'}</Button>
      </div>

      {summary && (
        <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl border bg-card px-6 py-4 text-sm">
          <span><span className="font-display text-2xl font-medium text-primary">{summary.paid}</span> <span className="text-muted-foreground">paid</span></span>
          <span><span className="font-display text-2xl font-medium">{summary.unpaid}</span> <span className="text-muted-foreground">unpaid</span></span>
          <span><span className="font-display text-2xl font-medium">{summary.total}</span> <span className="text-muted-foreground">total</span></span>
          <span className="text-muted-foreground">{summary.percentPaid}% paid</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" disabled={bulkBusy || noRows} onClick={() => bulk('PAID')}>Mark all paid</Button>
            <Button size="sm" variant="ghost" disabled={bulkBusy || noRows} onClick={() => bulk('UNPAID')}>Mark all unpaid</Button>
          </div>
        </div>
      )}

      {rows && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b px-6 py-4">
            <h2 className="font-display text-lg font-medium tracking-tight">Students <span className="text-muted-foreground font-normal">({rows.length})</span></h2>
          </div>
          {noRows ? (
            <div className="px-6 py-12 text-center"><p className="text-sm text-muted-foreground">No active students in this class.</p></div>
          ) : (
            <div className="divide-y">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{row.lastName} {row.firstName}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.admissionNumber}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={['text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full', row.status === 'PAID' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-800'].join(' ')}>
                      {row.status === 'PAID' ? 'Paid' : 'Unpaid'}
                    </span>
                    <Button size="sm" variant="ghost" disabled={busyId === row.id} onClick={() => toggle(row)} className="text-xs">
                      {row.status === 'PAID' ? 'Mark unpaid' : 'Mark paid'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!rows && !loading && (
        <p className="text-sm text-muted-foreground">Pick a class, session and term, then load the roster.</p>
      )}
    </>
  )
}
