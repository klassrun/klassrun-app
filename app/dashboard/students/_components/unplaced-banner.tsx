'use client'
// app/dashboard/students/_components/unplaced-banner.tsx
// student-record-app-v1
//
// A student with no enrollment in the current session is invisible to every
// roster there (registers, score sheets, report cards). That happens when a
// class was never run through promotion. This banner finds them and puts them
// back in the class they are recorded in now. Renders nothing when all is well.

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type Unplaced = { id: string; admissionNumber: string; firstName: string; lastName: string; className: string | null; classArchived: boolean }
type Data = { session: { name: string } | null; students: Unplaced[] }

export function UnplacedBanner({ onPlaced }: { onPlaced: () => void | Promise<void> }) {
  const [data, setData] = useState<Data | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/promotions/unplaced', { cache: 'no-store' })
      if (!res.ok) return
      setData((await res.json()) as Data)
    } catch { /* the banner is advisory; stay quiet on network errors */ }
  }
  useEffect(() => { load() }, [])

  if (!data || !data.session || data.students.length === 0) return null
  const placeable = data.students.filter((s) => !s.classArchived)
  const blocked = data.students.length - placeable.length
  const n = data.students.length

  async function carryOver() {
    if (placeable.length === 0) return
    if (!confirm(`Put ${placeable.length} student${placeable.length === 1 ? '' : 's'} into the class they are recorded in now, for ${data!.session!.name}?`)) return
    setBusy(true)
    try {
      const res = await fetch('/api/promotions/carry-over', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: placeable.map((s) => s.id) }),
      })
      const out = await res.json().catch(() => null)
      if (!res.ok) { toast.error(out?.error?.message ?? 'Could not carry them over'); return }
      toast.success(`${out?.placed ?? 0} student${out?.placed === 1 ? '' : 's'} placed for ${data!.session!.name}`)
      await load()
      await onPlaced()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-amber-300/60 bg-amber-50/60 px-5 py-4 text-sm text-amber-900">
      <p className="font-medium">
        {n} student{n === 1 ? ' is' : 's are'} not in any class for {data.session.name}.
      </p>
      <p className="mt-1">
        They won&apos;t appear on registers, score sheets or report cards this session until they are placed. This usually
        means their class was not promoted at the end of last session.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={carryOver} disabled={busy || placeable.length === 0} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50">
          {busy ? 'Placing…' : `Keep ${placeable.length === 1 ? 'them' : `all ${placeable.length}`} in their current class`}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg border border-amber-400 bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
          {open ? 'Hide list' : 'Show who'}
        </button>
        <span className="text-xs">To move some up a class instead, use Promotion.</span>
      </div>
      {blocked > 0 && <p className="mt-2 text-xs">{blocked} can&apos;t be placed because their class is archived — edit them into an active class first.</p>}
      {open && (
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs">
          {data.students.map((s) => (
            <li key={s.id}>
              <span className="font-mono">{s.admissionNumber}</span> · {s.lastName} {s.firstName} · {s.className ?? 'no class'}{s.classArchived ? ' (archived class)' : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
