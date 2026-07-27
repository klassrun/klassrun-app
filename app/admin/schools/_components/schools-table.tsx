'use client'
// superadmin-mvp + b2-schools-table
// Schools table with approve/suspend row actions, a date-derived subscription
// pill (fixes the old "Active" label on a lapsed paid school), and an inline
// Extend row that manually extends a subscription via the never-shrink API.
// Server page fetches the list; this component only mutates, then router.refresh().

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deriveSubscriptionState, pillFor } from '@/lib/subscription-status'

export type AdminSchool = {
  id: string
  name: string
  slug: string
  status: string
  state: string | null
  contactEmail: string | null
  createdAt: string
  teacherCount: number
  subscription: {
    plan: string
    status: string
    trialEndsAt: string | null
    endDate: string | null
  } | null
}

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PROVISIONING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  SUSPENDED: 'bg-red-500/15 text-red-300 border-red-500/30',
  EXPIRED: 'bg-background/10 text-background/50 border-background/20',
}

// b2-schools-table: tone -> classes for the derived subscription pill.
const PILL_TONE: Record<'ok' | 'warn' | 'bad' | 'muted', string> = {
  ok: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warn: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  bad: 'bg-red-500/15 text-red-300 border-red-500/30',
  muted: 'bg-background/10 text-background/50 border-background/20',
}

const PLANS = ['starter', 'standard', 'premium'] as const

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function SchoolsTable({ schools }: { schools: AdminSchool[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // b2-schools-table: which row's Extend panel is open, and its form fields.
  const [extendId, setExtendId] = useState<string | null>(null)
  const [days, setDays] = useState<string>('30')
  const [planChoice, setPlanChoice] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [extendBusy, setExtendBusy] = useState<boolean>(false)

  async function setStatus(school: AdminSchool, status: 'ACTIVE' | 'SUSPENDED') {
    if (status === 'SUSPENDED') {
      const okToSuspend = window.confirm(
        `Suspend ${school.name}? Every user at this school is locked out on their next request until you reinstate it.`,
      )
      if (!okToSuspend) return
    }
    setError(null)
    setBusyId(school.id)
    try {
      const res = await fetch(`/api/admin/schools/${school.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const parsed = await res.json().catch(() => null)
        setError(parsed?.error?.message || `Could not update ${school.name}.`)
      } else {
        router.refresh()
      }
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setBusyId(null)
    }
  }

  function openExtend(school: AdminSchool) {
    setError(null)
    setExtendId(school.id)
    setDays('30')
    setPlanChoice(school.subscription?.plan ?? '')
    setNote('')
  }

  function closeExtend() {
    setExtendId(null)
    setExtendBusy(false)
  }

  async function submitExtend(school: AdminSchool) {
    const n = Number(days)
    if (!Number.isInteger(n) || n < 1 || n > 366) {
      setError('Days must be a whole number between 1 and 366.')
      return
    }
    setError(null)
    setExtendBusy(true)
    try {
      const body: { extendDays: number; plan?: string; note?: string } = { extendDays: n }
      if (planChoice) body.plan = planChoice
      if (note.trim()) body.note = note.trim()
      const res = await fetch(`/api/admin/schools/${school.id}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const parsed = await res.json().catch(() => null)
        setError(parsed?.error?.message || `Could not extend ${school.name}.`)
        setExtendBusy(false)
      } else {
        closeExtend()
        router.refresh()
      }
    } catch {
      setError('Could not reach the server. Try again.')
      setExtendBusy(false)
    }
  }

  if (schools.length === 0) {
    return <p className="text-sm text-background/50">No schools yet.</p>
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-background/15">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-background/10 text-left text-[11px] uppercase tracking-wider text-background/50">
              <th className="px-4 py-3 font-medium">School</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Subscription</th>
              <th className="px-4 py-3 font-medium">Teachers</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => {
              const tone = STATUS_TONE[s.status] || STATUS_TONE.EXPIRED
              const busy = busyId === s.id
              const sub = s.subscription
              // b2-schools-table: derived pill replaces the old raw status string.
              const derived = deriveSubscriptionState(sub, s.status)
              const pill = pillFor(derived)
              const subDetail = sub
                ? sub.status === 'TRIAL'
                  ? `Trial ends ${fmtDate(sub.trialEndsAt)}`
                  : `ends ${fmtDate(sub.endDate)}`
                : 'No subscription'
              const isOpen = extendId === s.id
              return (
                <Fragment key={s.id}>
                  <tr className="border-b border-background/5 last:border-0">
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium text-background">{s.name}</p>
                      <p className="font-mono text-[11px] text-background/50">{s.slug}.klassrun.com</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tone}`}>
                        {titleCase(s.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-background/80">{sub ? titleCase(sub.plan) : '—'}</td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${PILL_TONE[pill.tone]}`}>
                        {pill.label}
                      </span>
                      <p className="mt-1 text-[11px] text-background/50">{subDetail}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-background/80">{s.teacherCount}</td>
                    <td className="px-4 py-4 align-top text-xs text-background/60">{fmtDate(s.createdAt)}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy || isOpen}
                          onClick={() => openExtend(s)}
                          className="rounded-lg border border-background/25 bg-background/5 px-3 py-1.5 text-xs font-medium text-background/80 transition-colors hover:bg-background/15 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Extend
                        </button>
                        <button
                          type="button"
                          disabled={busy || s.status === 'ACTIVE'}
                          onClick={() => setStatus(s, 'ACTIVE')}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {s.status === 'SUSPENDED' ? 'Reinstate' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={busy || s.status === 'SUSPENDED'}
                          onClick={() => setStatus(s, 'SUSPENDED')}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-b border-background/5 bg-background/[0.03]">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex flex-wrap items-end gap-4">
                          <div>
                            <label className="mb-1 block text-[11px] uppercase tracking-wider text-background/50">Days</label>
                            <input
                              type="number" min={1} max={366} value={days}
                              onChange={(e) => setDays(e.target.value)}
                              className="w-24 rounded-lg border border-background/20 bg-background/10 px-3 py-1.5 text-sm text-background"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] uppercase tracking-wider text-background/50">Plan (optional)</label>
                            <select
                              value={planChoice}
                              onChange={(e) => setPlanChoice(e.target.value)}
                              className="rounded-lg border border-background/20 bg-background/10 px-3 py-1.5 text-sm text-background"
                            >
                              <option value="">Keep current</option>
                              {PLANS.map((p) => (
                                <option key={p} value={p}>{titleCase(p)}</option>
                              ))}
                            </select>
                          </div>
                          <div className="min-w-[220px] flex-1">
                            <label className="mb-1 block text-[11px] uppercase tracking-wider text-background/50">Note (optional)</label>
                            <input
                              type="text" value={note} maxLength={500}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="e.g. bank transfer received"
                              className="w-full rounded-lg border border-background/20 bg-background/10 px-3 py-1.5 text-sm text-background"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={extendBusy}
                              onClick={() => submitExtend(s)}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {extendBusy ? 'Extending…' : 'Confirm extend'}
                            </button>
                            <button
                              type="button"
                              disabled={extendBusy}
                              onClick={closeExtend}
                              className="rounded-lg border border-background/20 px-4 py-1.5 text-xs font-medium text-background/70 transition-colors hover:bg-background/10 disabled:opacity-40"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-background/50">
                          Never-shrink: days are added on top of any paid time still remaining. A lapsed school starts from today.
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
