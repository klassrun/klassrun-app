'use client'
// superadmin-mvp — schools table with approve/suspend row actions.
// Server page fetches the list; this component only mutates, then router.refresh().

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
              const subLine = sub
                ? sub.status === 'TRIAL'
                  ? `Trial ends ${fmtDate(sub.trialEndsAt)}`
                  : `${titleCase(sub.status)} · ends ${fmtDate(sub.endDate)}`
                : 'No subscription'
              return (
                <tr key={s.id} className="border-b border-background/5 last:border-0">
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
                  <td className="px-4 py-4 align-top text-xs text-background/60">{subLine}</td>
                  <td className="px-4 py-4 align-top text-background/80">{s.teacherCount}</td>
                  <td className="px-4 py-4 align-top text-xs text-background/60">{fmtDate(s.createdAt)}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center justify-end gap-2">
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
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
