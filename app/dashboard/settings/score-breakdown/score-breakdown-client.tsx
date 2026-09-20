'use client'
// app/dashboard/settings/score-breakdown/score-breakdown-client.tsx
// grading-config-app-v1
//
// The school's score breakdown: 1-6 named parts whose marks add up to exactly
// 100 (e.g. CA 40 + Exam 60). A term locks the breakdown it had when its first
// score was saved, so a change here only reaches terms that have no scores yet.
// The API validates everything again; the checks here are for instant feedback.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

type Part = { label: string; max: number }
export type BreakdownView = {
  parts: Part[]
  isDefault: boolean
  maxParts: number
  currentTerm: { sessionName: string; term: 'FIRST' | 'SECOND' | 'THIRD'; locked: boolean; parts: Part[]; needsReview?: number } | null // grading-config-apply-app-v1
  note?: string
}
type Draft = { label: string; max: string }

const TERM_LABEL: Record<string, string> = { FIRST: 'First Term', SECOND: 'Second Term', THIRD: 'Third Term' }
const LABEL_MAX = 12
const PRESETS: Array<{ name: string; parts: Part[] }> = [
  { name: 'Klassrun default', parts: [{ label: 'CA1', max: 20 }, { label: 'CA2', max: 20 }, { label: 'Obj', max: 20 }, { label: 'Theory', max: 40 }] },
  { name: 'CA 40 + Exam 60', parts: [{ label: 'CA', max: 40 }, { label: 'Exam', max: 60 }] },
  { name: '1st CA + 2nd CA + Exam', parts: [{ label: '1st CA', max: 20 }, { label: '2nd CA', max: 20 }, { label: 'Exam', max: 60 }] },
  { name: 'Tests + Assignment + Exam', parts: [{ label: 'Test 1', max: 10 }, { label: 'Test 2', max: 10 }, { label: 'Assignment', max: 10 }, { label: 'Exam', max: 70 }] },
]

const toDraft = (parts: Part[]): Draft[] => parts.map((p) => ({ label: p.label, max: String(p.max) }))
const describe = (parts: Part[]) => parts.map((p) => `${p.label} ${p.max}`).join(' · ')

function checkDraft(draft: Draft[]): { total: number; problems: string[] } {
  const problems: string[] = []
  const seen = new Set<string>()
  let total = 0
  draft.forEach((d, i) => {
    const label = d.label.trim()
    const name = label || `Part ${i + 1}`
    if (!label) problems.push(`${name} needs a name`)
    else if (seen.has(label.toLowerCase())) problems.push(`Two parts are both called "${label}"`)
    seen.add(label.toLowerCase())
    const n = Number(d.max)
    if (d.max.trim() === '' || !Number.isInteger(n) || n < 1 || n > 100) problems.push(`${name}: marks must be a whole number from 1 to 100`)
    else total += n
  })
  if (total !== 100) problems.push(`The parts add up to ${total}. They must add up to exactly 100.`)
  return { total, problems }
}

export function ScoreBreakdownClient({ initial }: { initial: BreakdownView }) {
  const router = useRouter()
  const [view, setView] = useState<BreakdownView>(initial)
  const [draft, setDraft] = useState<Draft[]>(toDraft(initial.parts))
  const [saving, setSaving] = useState(false)
  const [applyNow, setApplyNow] = useState(false) // grading-config-apply-app-v1
  const maxParts = view.maxParts || 6
  const { total, problems } = checkDraft(draft)
  const ct = view.currentTerm

  function update(i: number, patch: Partial<Draft>) {
    setDraft((prev) => prev.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  }
  function addPart() {
    setDraft((prev) => (prev.length < maxParts ? [...prev, { label: '', max: '' }] : prev))
  }
  function removePart(i: number) {
    setDraft((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev))
  }

  async function send(body: unknown) {
    setSaving(true)
    try {
      const res = await fetch('/api/schools/grading-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not save the score breakdown')
        return
      }
      const next = data as BreakdownView
      setView(next)
      setDraft(toDraft(next.parts))
      setApplyNow(false)
      toast.success(next.note ?? 'Saved')
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function save() {
    if (problems.length > 0) { toast.error(problems[0]); return }
    send({ parts: draft.map((d) => ({ label: d.label.trim(), max: Number(d.max) })), applyToCurrentTerm: applyNow && !!ct?.locked })
  }
  function resetToDefault() {
    if (!confirm('Go back to the Klassrun default (CA1 20 · CA2 20 · Obj 20 · Theory 40)?')) return
    send({ reset: true, applyToCurrentTerm: applyNow && !!ct?.locked })
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard/settings" className="text-sm text-muted-foreground transition-colors hover:text-foreground">← Back to settings</Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Settings · Results</p>
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Score breakdown</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          How each subject&apos;s 100 marks are split. Teachers enter a score for every part, and Klassrun adds them up
          to the total that grades, positions and report cards use.
        </p>

        {ct && (
          <div className={['mt-8 rounded-xl border px-5 py-4 text-sm', ct.locked ? 'border-amber-300/60 bg-amber-50/60 text-amber-900' : 'border-primary/30 bg-primary/5'].join(' ')}>
            {ct.locked ? (
              <>
                <p className="font-medium">{TERM_LABEL[ct.term]} {ct.sessionName} is locked to: {describe(ct.parts)}</p>
                <p className="mt-1">Scores have already been saved this term, so it keeps this breakdown. Anything you save here applies from the next term.</p>
                {(ct.needsReview ?? 0) > 0 && (
                  <p className="mt-2 font-medium">{ct.needsReview} saved score{ct.needsReview === 1 ? ' does' : 's do'} not fit this term&apos;s breakdown yet. Teachers see {ct.needsReview === 1 ? 'it' : 'them'} highlighted in Results.</p>
                )}
              </>
            ) : (
              <>
                <p className="font-medium">{TERM_LABEL[ct.term]} {ct.sessionName} has no scores yet.</p>
                <p className="mt-1 text-muted-foreground">What you save here applies to this term. Once the first score is saved, the term&apos;s breakdown is locked.</p>
              </>
            )}
          </div>
        )}

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start from a common setup</h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} type="button" onClick={() => setDraft(toDraft(p.parts))} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
                {p.name}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parts ({draft.length} of {maxParts})</h2>
          <div className="space-y-2">
            {draft.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={d.label}
                  maxLength={LABEL_MAX}
                  placeholder={`Part ${i + 1} name, e.g. Exam`}
                  onChange={(e) => update(i, { label: e.target.value })}
                  className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={d.max}
                  placeholder="Marks"
                  onChange={(e) => update(i, { max: e.target.value })}
                  className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-center text-sm"
                />
                <button type="button" onClick={() => removePart(i)} disabled={draft.length <= 1} className="h-10 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={addPart} disabled={draft.length >= maxParts} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40">
              + Add a part
            </button>
            <p className={['text-sm font-medium', total === 100 ? 'text-primary' : 'text-red-600'].join(' ')}>Total: {total} / 100</p>
          </div>
          {problems.length > 0 && <p className="mt-2 text-xs text-red-600">{problems[0]}</p>}
          <p className="mt-2 text-xs text-muted-foreground">Keep names short (up to {LABEL_MAX} characters) so they fit on the report card, e.g. CA1, Test, Exam.</p>
        </section>

        {/* grading-config-apply-app-v1: change a term that already has scores */}
        {ct && ct.locked && (
          <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-xl border bg-card px-5 py-4 text-sm">
            <input type="checkbox" checked={applyNow} onChange={(e) => setApplyNow(e.target.checked)} className="mt-0.5 h-4 w-4" />
            <span>
              <span className="font-medium">Also apply to {TERM_LABEL[ct.term]} {ct.sessionName}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                This term already has scores. They are not changed. Any that go over the new maximums are highlighted for
                teachers to fix, and report cards can&apos;t be generated until they are. Not possible once any of this
                term&apos;s report cards are locked.
              </span>
            </span>
          </label>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button type="button" onClick={save} disabled={saving || problems.length > 0} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'Saving…' : applyNow && ct?.locked ? 'Save and apply to this term' : 'Save breakdown'}
          </button>
          <button type="button" onClick={resetToDefault} disabled={saving || view.isDefault} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40">
            Reset to default
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Saved: {describe(view.parts)}{view.isDefault ? ' (Klassrun default)' : ''}
        </p>
      </div>
    </div>
  )
}
