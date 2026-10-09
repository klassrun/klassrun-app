'use client'
// app/dashboard/report-cards/report-cards-client.tsx
// ops-1b-reportcards-client

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { ReportCardListItem } from './page'

type ClassItem = { id: string; name: string; archivedAt: string | null }
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean; nextTermBeginsByTerm?: Record<string, string> | null } // rc-next-term-app-v1

const TERMS: Array<{ value: 'FIRST' | 'SECOND' | 'THIRD'; label: string }> = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
]
const TERM_LABEL: Record<string, string> = { FIRST: 'First Term', SECOND: 'Second Term', THIRD: 'Third Term' }

// rc-next-term-app-v1: 'YYYY-MM-DD' → 'Tuesday, 12 January 2027' — the same wording the card prints.
const NT_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const NT_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function formatLongDate(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return v
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return `${NT_DAYS[d.getUTCDay()]}, ${Number(m[3])} ${NT_MONTHS[Number(m[2]) - 1]} ${m[1]}`
}
// Only a complete, sensible date is saved: typing a year on a desktop passes
// through 0002, 0020, 0202… before 2027 — none of those may reach the server.
const isSaveableDate = (v: string) => /^(20\d\d|2100)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v)

export function ReportCardsClient({
  classes,
  sessions,
  initialCards,
}: {
  classes: ClassItem[]
  sessions: SessionItem[]
  initialCards: ReportCardListItem[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const currentSession = sessions.find((s) => s.isCurrent) ?? sessions[0] ?? null

  const [classId, setClassId] = useState<string>(classes[0]?.id ?? '')
  const [sessionId, setSessionId] = useState<string>(currentSession?.id ?? '')
  const [term, setTerm] = useState<'FIRST' | 'SECOND' | 'THIRD'>(currentSession?.currentTerm ?? 'FIRST')
  const [generating, setGenerating] = useState(false)
  const [printing, setPrinting] = useState(false) // rc-class-pdf-app-v1
  const [locking, setLocking] = useState(false) // rc-lock-class-app-v1
  // rc-next-term-app-v1: { [sessionId]: { FIRST: "2027-01-12", ... } }, seeded from the sessions list
  const [nextTermBySession, setNextTermBySession] = useState<Record<string, Record<string, string>>>(
    () => Object.fromEntries(sessions.map((s) => [s.id, { ...(s.nextTermBeginsByTerm ?? {}) }]))
  )
  const [nextTermSaving, setNextTermSaving] = useState(false)
  const nextTermDate = nextTermBySession[sessionId]?.[term] ?? ''
  const sessionName = sessions.find((s) => s.id === sessionId)?.name ?? 'this session'
  const [cards, setCards] = useState<ReportCardListItem[]>(initialCards)

  async function reloadList() {
    const res = await fetch('/api/report-cards', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json().catch(() => null)
    if (data?.reportCards) setCards(data.reportCards)
  }

  async function generate() {
    if (!classId) { toast.error('Pick a class'); return }
    if (!sessionId) { toast.error('Pick a session'); return }
    setGenerating(true)
    const res = await fetch('/api/report-cards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, sessionId, term }),
    })
    setGenerating(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not generate report cards')
      return
    }
    const data = await res.json().catch(() => null)
    toast.success(`Generated ${data?.count ?? 0} report card${data?.count === 1 ? '' : 's'}`)
    await reloadList()
    startTransition(() => router.refresh())
  }

  // rc-class-pdf-app-v1: refresh every unlocked card (same as Generate), then open
  // ONE PDF for the class — a page per student — in a new tab, ready to print.
  // The tab is opened inside the click so pop-up blockers allow it; it fills in
  // once the cards are refreshed. If pop-ups are blocked, the file downloads instead.
  async function printClass() {
    if (!classId) { toast.error('Pick a class'); return }
    if (!sessionId) { toast.error('Pick a session'); return }
    const win = window.open('', '_blank')
    if (win) {
      win.document.title = 'Preparing report cards…'
      win.document.body.innerHTML = '<p style="font-family:system-ui,sans-serif;padding:48px 24px;color:#131b26">Preparing report cards… the PDF opens here in a moment.</p>'
    }
    setPrinting(true)
    const res = await fetch('/api/report-cards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, sessionId, term }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      win?.close()
      setPrinting(false)
      toast.error(b?.error?.message || 'Could not refresh the report cards')
      return
    }
    const data = await res.json().catch(() => null)
    const url = `/api/report-cards/class-pdf?${new URLSearchParams({ classId, sessionId, term }).toString()}`
    if (win) {
      win.location.href = url
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = ''
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
    const n = Number(data?.count ?? 0)
    toast.success(`Opening ${n} report card${n === 1 ? '' : 's'} — print from the new tab`)
    setPrinting(false)
    await reloadList()
    startTransition(() => router.refresh())
  }

  // rc-next-term-app-v1: save (or clear, with null) the date for the session + term on screen.
  // Captures both before awaiting, so switching the pickers mid-save cannot misfile it.
  async function saveNextTerm(date: string | null) {
    if (!sessionId) return
    const sid = sessionId
    const t = term
    setNextTermSaving(true)
    const res = await fetch(`/api/sessions/${encodeURIComponent(sid)}/next-term-begins`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: t, date }),
    })
    setNextTermSaving(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not save the date. Check your connection and pick it again.')
      return
    }
    setNextTermBySession((prev) => {
      const cur = { ...(prev[sid] ?? {}) }
      if (date) cur[t] = date
      else delete cur[t]
      return { ...prev, [sid]: cur }
    })
    toast.success(date ? `Saved — cards will say: Next term begins ${formatLongDate(date)}` : 'Removed — cards will leave this line off')
  }

  // rc-lock-class-app-v1: lock / unlock every card of the class + session + term on screen.
  // Asks first in plain words, then says exactly what it did.
  async function setClassLock(lock: boolean) {
    if (!classId || !sessionId) return
    const className = classes.find((c) => c.id === classId)?.name ?? 'this class'
    const what = `${className} · ${TERM_LABEL[term]} · ${sessionName}`
    const question = lock
      ? `Lock every ${what} report card?\n\nLocked cards stay exactly as they are — Generate, Print class and Re-render PDF will not change them until you unlock.`
      : `Unlock every ${what} report card?\n\nThey will refresh from the latest scores, attendance, behaviour, comments and date the next time you generate or print.`
    if (!window.confirm(question)) return
    setLocking(true)
    const res = await fetch(`/api/report-cards/${lock ? 'lock-class' : 'unlock-class'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, sessionId, term }),
    })
    setLocking(false)
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      toast.error(data?.error?.message || (lock ? 'Could not lock the class' : 'Could not unlock the class'))
      return
    }
    const n = Number(data?.changed ?? 0)
    const rest = Number(data?.unchanged ?? 0)
    const s = (k: number) => (k === 1 ? '' : 's')
    toast.success(lock
      ? `Locked ${n} card${s(n)}${rest ? ` (${rest} already locked)` : ''}`
      : `Unlocked ${n} card${s(n)}${rest ? ` (${rest} ${rest === 1 ? "wasn't" : "weren't"} locked)` : ''}`)
    await reloadList()
    startTransition(() => router.refresh())
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
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Report cards</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Generate Nigerian-format report cards for a class, term by term. Positions and grades are computed from entered scores.
        </p>

        <div className="mt-10 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Generate</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-muted-foreground">
              Class
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                {classes.length === 0 && <option value="">No classes</option>}
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Session
              <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                {sessions.length === 0 && <option value="">No sessions</option>}
                {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (current)' : ''}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Term
              <select value={term} onChange={(e) => setTerm(e.target.value as 'FIRST' | 'SECOND' | 'THIRD')} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground">
                {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <button type="button" onClick={generate} disabled={generating || printing || !classId || !sessionId} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {generating ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
          {/* rc-next-term-app-v1: Next term begins */}
          <div className="mt-5 rounded-lg border border-border bg-background/60 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="block text-sm font-medium text-foreground">
                Next term begins
                <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">
                  Printed on every {TERM_LABEL[term]} card for {sessionName}. Set it once — every class uses it.
                  {term === 'THIRD' ? ' On Third Term cards this is usually when the next session starts.' : ''}
                </span>
                <input
                  key={`${sessionId}:${term}:${nextTermDate}`}
                  type="date"
                  defaultValue={nextTermDate}
                  disabled={!sessionId || nextTermSaving}
                  onChange={(e) => {
                    const v = e.target.value
                    if (isSaveableDate(v) && v !== nextTermDate) void saveNextTerm(v)
                  }}
                  className="mt-2 block w-full max-w-[220px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
                />
              </label>
              {nextTermDate && (
                <button type="button" onClick={() => void saveNextTerm(null)} disabled={nextTermSaving} className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50">
                  Remove
                </button>
              )}
            </div>
            <p className={`mt-2 text-xs ${nextTermDate ? 'text-primary' : 'text-amber-700'}`}>
              {nextTermSaving ? 'Saving…' : nextTermDate ? `✓ Saved — cards will say: Next term begins ${formatLongDate(nextTermDate)}` : 'Not set — cards will leave this line off.'}
            </p>
          </div>
          {/* rc-class-pdf-app-v1: Print class */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
              Regenerating overwrites the snapshot for that class &amp; term. Locked cards are protected.
              {' '}<span className="font-medium text-foreground">Print class</span> refreshes the cards first, then opens one PDF with a page per student.
              {!nextTermDate && <span className="mt-1 block font-medium text-amber-700">Next term begins isn&apos;t set for {TERM_LABEL[term]} — cards will print without it. {/* rc-next-term-app-v1 */}</span>}
            </p>
            {/* rc-lock-class-app-v1: Print class · Lock class, with a quiet Unlock class link */}
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <button type="button" onClick={printClass} disabled={printing || generating || locking || !classId || !sessionId} className="shrink-0 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors">
                  {printing ? 'Refreshing cards…' : 'Print class'}
                </button>
                <button type="button" onClick={() => void setClassLock(true)} disabled={locking || printing || generating || !classId || !sessionId} className="shrink-0 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors">
                  {locking ? 'Working…' : 'Lock class'}
                </button>
              </div>
              <button type="button" onClick={() => void setClassLock(false)} disabled={locking || printing || generating || !classId || !sessionId} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50">
                Unlock class…
              </button>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {cards.length === 0 ? 'No report cards yet' : cards.length === 1 ? '1 report card' : `${cards.length} report cards`}
          </h2>
          {cards.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Generate a class above to see report cards here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card divide-y">
              {cards.map((c) => (
                <Link key={c.id} href={`/dashboard/report-cards/${c.id}`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.student.lastName} {c.student.firstName}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{c.student.admissionNumber}</span> · {c.session.name} · {TERM_LABEL[c.term]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    {c.summary && (
                      <span>Avg {c.summary.average} · Pos {c.summary.overallPosition ?? '—'}/{c.summary.classSize}</span>
                    )}
                    {c.lockedAt && <span className="rounded-full bg-muted px-2 py-0.5 font-medium uppercase tracking-wider">Locked</span>}
                    {c.pdfUrl && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">PDF</span>}
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
