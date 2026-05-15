'use client'

// app/dashboard/academic/academic-client.tsx
//
// SCHOOL_ADMIN view: list of sessions, create new, edit dates,
// make-current, advance-term. Editorial styling matches the rest of
// the dashboard (Fraunces display, primary green, editorial-number).
//
// Uses shadcn primitives:
//   - <Dialog>   for Create / Edit dates / Advance-term confirm
//   - <Popover>  + <Calendar> for date pickers
//
// batch-2c-phase-1-academic-client

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { AcademicSession } from './page'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const TERM_LABEL: Record<AcademicSession['currentTerm'], string> = {
  FIRST: 'First Term',
  SECOND: 'Second Term',
  THIRD: 'Third Term',
}

export function AcademicClient({
  initialSessions,
}: {
  initialSessions: AcademicSession[]
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editDatesFor, setEditDatesFor] = useState<AcademicSession | null>(null)
  const [advanceFor, setAdvanceFor] = useState<AcademicSession | null>(null)

  const sessions = initialSessions
  const current = sessions.find((s) => s.isCurrent) ?? null
  const others  = sessions.filter((s) => !s.isCurrent)

  async function handleMakeCurrent(s: AcademicSession) {
    setBusyId(s.id)
    try {
      const res = await fetch(`/api/sessions/${s.id}/make-current`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not make this session current')
      } else {
        toast.success(`${s.name} is now the current session`)
        router.refresh()
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleAdvanceTerm(s: AcademicSession) {
    setBusyId(s.id)
    try {
      const res = await fetch(`/api/sessions/${s.id}/advance-term`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not advance term')
      } else {
        toast.success(`Advanced to ${TERM_LABEL[data.session.currentTerm as AcademicSession['currentTerm']]}`)
        router.refresh()
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setBusyId(null)
      setAdvanceFor(null)
    }
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:py-16">
        <div className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Academic
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Sessions <span className="font-display-wonky italic text-primary">&amp;</span> terms
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            One session per academic year. One term active at a time. Lesson notes and report cards stamp themselves with whatever is current here.
          </p>
        </div>

        {/* Current session card */}
        {current ? (
          <section className="mb-12">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Current session
            </h2>
            <article className="rounded-2xl border border-primary/30 bg-accent/30 p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="editorial-number text-5xl text-primary/40">01</p>
                  <h3 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                    {current.name}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
                      {TERM_LABEL[current.currentTerm]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateRange(current.startDate, current.endDate)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAdvanceFor(current)}
                    disabled={current.currentTerm === 'THIRD' || busyId === current.id}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {current.currentTerm === 'THIRD' ? 'Term complete' : 'Advance term'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDatesFor(current)}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    Edit dates
                  </button>
                </div>
              </div>
            </article>
          </section>
        ) : (
          <section className="mb-12 rounded-2xl border border-dashed bg-card/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No current session. Create one to start tagging lesson notes and report cards.
            </p>
          </section>
        )}

        {/* Other sessions */}
        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              All sessions
            </h2>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              New session
            </button>
          </div>

          {others.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card/40 p-6 text-center text-sm text-muted-foreground">
              Just one session so far. Create another when next year begins.
            </div>
          ) : (
            <ul className="space-y-px overflow-hidden rounded-xl border bg-card">
              {others.map((s, idx) => (
                <li key={s.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
                  <span className="editorial-number text-2xl text-primary/30 sm:flex-shrink-0">
                    {String(idx + 2).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <p className="font-display text-lg font-medium leading-tight tracking-tight">
                      {s.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {TERM_LABEL[s.currentTerm]} · {formatDateRange(s.startDate, s.endDate)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleMakeCurrent(s)}
                      disabled={busyId === s.id}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyId === s.id ? 'Working…' : 'Make current'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDatesFor(s)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Edit dates
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="max-w-xl text-xs text-muted-foreground">
          Need to rename a session? You can&apos;t — names lock at creation because they appear on lesson notes and report cards. Pick carefully when creating.
        </p>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      <CreateSessionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => { setCreateOpen(false); router.refresh() }}
        hasCurrent={current !== null}
      />

      <EditDatesDialog
        session={editDatesFor}
        onOpenChange={(open) => { if (!open) setEditDatesFor(null) }}
        onSaved={() => { setEditDatesFor(null); router.refresh() }}
      />

      <AdvanceConfirmDialog
        session={advanceFor}
        onOpenChange={(open) => { if (!open && !busyId) setAdvanceFor(null) }}
        onConfirm={advanceFor ? () => handleAdvanceTerm(advanceFor) : () => {}}
        busy={advanceFor ? busyId === advanceFor.id : false}
      />
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return 'No dates set'
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  if (start && end) return `${fmt(start)} → ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

function formatDateForButton(d: Date | undefined): string {
  if (!d) return 'Pick a date'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isoToDate(iso: string | null): Date | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  return isNaN(d.getTime()) ? undefined : d
}

function dateToIso(d: Date | undefined): string | null {
  if (!d) return null
  return d.toISOString()
}

// ── Date picker (shadcn Popover + Calendar) ───────────────────────────────

function DatePickerField({
  label, value, onChange,
}: {
  label: string
  value: Date | undefined
  onChange: (d: Date | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <span className={value ? '' : 'text-muted-foreground'}>
              {formatDateForButton(value)}
            </span>
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 2v2M11 2v2M2 6h12M3 4h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); setOpen(false) }}

          />
          {value && (
            <div className="border-t px-3 py-2">
              <button
                type="button"
                onClick={() => { onChange(undefined); setOpen(false) }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear date
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ── Dialogs ───────────────────────────────────────────────────────────────

function CreateSessionDialog({
  open, onOpenChange, onCreated, hasCurrent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  hasCurrent: boolean
}) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate]     = useState<Date | undefined>(undefined)
  const [makeCurrent, setMakeCurrent] = useState(!hasCurrent)
  const [submitting, setSubmitting] = useState(false)

  // Reset form when dialog re-opens
  function reset() {
    setName(''); setStartDate(undefined); setEndDate(undefined); setMakeCurrent(!hasCurrent); setSubmitting(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim() === '') {
      toast.error('Session name is required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          startDate: dateToIso(startDate),
          endDate: dateToIso(endDate),
          makeCurrent,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not create session')
        setSubmitting(false)
        return
      }
      toast.success(`Created ${data.session.name}`)
      reset()
      onCreated()
    } catch {
      toast.error('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            New session
          </p>
          <DialogTitle className="font-display text-2xl font-medium tracking-tight">
            Add an academic year
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a new academic session. Names are immutable once created.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Name<span className="ml-0.5 text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2026/2027"
              maxLength={50}
              required
              autoFocus
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              This name appears on lesson notes and report cards. It <em>can&apos;t be changed later</em> — pick carefully.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DatePickerField label="Start date" value={startDate} onChange={setStartDate} />
            <DatePickerField label="End date" value={endDate} onChange={setEndDate} />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={makeCurrent}
              onChange={(e) => setMakeCurrent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Make this the current session
              <span className="block text-[11px] text-muted-foreground">
                {hasCurrent
                  ? 'Replaces the current session as the active one.'
                  : 'You have no current session — this will become it.'}
              </span>
            </span>
          </label>

          <DialogFooter className="gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => { onOpenChange(false); reset() }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || name.trim() === ''}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create session'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditDatesDialog({
  session, onOpenChange, onSaved,
}: {
  session: AcademicSession | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate]     = useState<Date | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [lastSessionId, setLastSessionId] = useState<string | null>(null)

  // Sync local state when session changes
  if (session && session.id !== lastSessionId) {
    setStartDate(isoToDate(session.startDate))
    setEndDate(isoToDate(session.endDate))
    setLastSessionId(session.id)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: dateToIso(startDate),
          endDate:   dateToIso(endDate),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not save dates')
        setSubmitting(false)
        return
      }
      toast.success('Dates saved')
      onSaved()
    } catch {
      toast.error('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={session !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Edit dates
          </p>
          <DialogTitle className="font-display text-2xl font-medium tracking-tight">
            {session?.name ?? ''}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Update the start and end dates for this academic session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <DatePickerField label="Start date" value={startDate} onChange={setStartDate} />
            <DatePickerField label="End date" value={endDate} onChange={setEndDate} />
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save dates'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AdvanceConfirmDialog({
  session, onOpenChange, onConfirm, busy,
}: {
  session: AcademicSession | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  busy: boolean
}) {
  if (!session) {
    // Render closed dialog so animation works
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    )
  }

  const next = session.currentTerm === 'FIRST' ? 'Second Term' : 'Third Term'

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!busy) onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Confirm
          </p>
          <DialogTitle className="font-display text-2xl font-medium tracking-tight">
            Advance to <span className="font-display-wonky italic text-primary">{next}</span>?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Every teacher&apos;s dashboard, every new lesson note, every report card will be stamped with{' '}
            <strong className="text-foreground">{next}</strong> from this point on. This can&apos;t be reversed from the UI.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Advancing…' : `Yes, advance to ${next}`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

