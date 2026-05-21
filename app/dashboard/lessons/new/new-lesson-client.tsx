'use client'
// app/dashboard/lessons/new/new-lesson-client.tsx
// batch-3-phase-1-lessons-new-client

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

type Assignment = {
  class: { id: string; name: string; level: string | null }
  subjects: Array<{ id: string; name: string; archivedAt: string | null; createdAt: string }>
}

type LessonNote = {
  id: string
  topic: string
  content: Record<string, unknown>
}

type Stage = 'SELECTING' | 'GENERATING' | 'REVIEWING'

export function NewLessonClient({ assignments }: { assignments: Assignment[] }) {
  const router = useRouter()

  const [classId, setClassId] = useState<string>(assignments[0]?.class.id ?? '')
  const [subjectId, setSubjectId] = useState<string>(
    assignments[0]?.subjects[0]?.id ?? ''
  )
  const [topic, setTopic] = useState('')
  const [week, setWeek] = useState<string>('')
  const [duration, setDuration] = useState<string>('40')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const [stage, setStage] = useState<Stage>('SELECTING')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<LessonNote | null>(null)

  const subjects = useMemo(() => {
    const a = assignments.find((x) => x.class.id === classId)
    return a?.subjects ?? []
  }, [assignments, classId])

  // When class changes, reset subject to first available
  function onClassChange(id: string) {
    setClassId(id)
    const a = assignments.find((x) => x.class.id === id)
    setSubjectId(a?.subjects[0]?.id ?? '')
  }

  if (assignments.length === 0) {
    return (
      <Shell>
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-base text-muted-foreground">
            You haven&apos;t been assigned to any subjects yet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask your school admin to assign you to a subject before generating lesson notes.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </Shell>
    )
  }

  async function generate() {
    setError(null)
    const trimmed = topic.trim()
    if (trimmed.length < 3) {
      setError('Topic must be at least 3 characters')
      return
    }
    if (trimmed.length > 200) {
      setError('Topic must be 200 characters or fewer')
      return
    }
    if (!classId || !subjectId) {
      setError('Pick a class and subject')
      return
    }

    setStage('GENERATING')

    const body: Record<string, unknown> = {
      classId,
      subjectId,
      topic: trimmed,
      duration: Number(duration) || 40,
    }
    if (week.trim()) body.week = Number(week)
    if (additionalNotes.trim()) body.additionalNotes = additionalNotes.trim()

    const res = await fetch('/api/notes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      const msg = data?.error?.message || 'Could not generate lesson note'
      setError(msg)
      setStage('SELECTING')
      return
    }

    const data = (await res.json().catch(() => null)) as { note: LessonNote } | null
    if (!data?.note) {
      setError('AI returned an empty response')
      setStage('SELECTING')
      return
    }
    setNote(data.note)
    setStage('REVIEWING')
  }

  async function discard() {
    if (!note) return
    if (!confirm('Discard this lesson note?')) return
    await fetch(`/api/notes/${note.id}`, { method: 'DELETE' })
    toast.success('Lesson note discarded')
    setNote(null)
    setStage('SELECTING')
  }

  function saveAndView() {
    if (!note) return
    toast.success('Lesson note saved')
    router.push(`/dashboard/lessons/${note.id}`)
  }

  function backToList() {
    if (!note) return
    toast.success('Lesson note saved')
    router.push('/dashboard/lessons')
  }

  return (
    <Shell>
      {stage === 'SELECTING' && (
        <div>
          <h2 className="font-display text-2xl font-medium leading-tight tracking-tight mb-8">
            Generate a lesson note
          </h2>

          <div className="space-y-5 max-w-2xl">
            <div>
              <label htmlFor="class" className="block text-xs font-medium text-foreground">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                id="class"
                value={classId}
                onChange={(e) => onClassChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {assignments.map((a) => (
                  <option key={a.class.id} value={a.class.id}>{a.class.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-xs font-medium text-foreground">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                id="subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="topic" className="block text-xs font-medium text-foreground">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
                placeholder="e.g. Fractions and decimals"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="week" className="block text-xs font-medium text-foreground">
                  Week (optional)
                </label>
                <input
                  id="week"
                  type="number"
                  min={1}
                  max={13}
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  placeholder="e.g. 4"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-xs font-medium text-foreground">
                  Duration (mins)
                </label>
                <input
                  id="duration"
                  type="number"
                  min={10}
                  max={240}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-medium text-foreground">
                Notes for AI (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                maxLength={500}
                placeholder="e.g. Focus on real-world Nigerian examples like buying foodstuffs at the market."
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {additionalNotes.length}/500
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={generate}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Generate lesson note
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'GENERATING' && (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-display text-2xl font-medium leading-tight tracking-tight">
            Generating your lesson note…
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Usually takes 5–10 seconds.
          </p>
          <div className="mx-auto mt-8 h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      )}

      {stage === 'REVIEWING' && note && (
        <div>
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-display text-2xl font-medium leading-tight tracking-tight">
              ✓ Lesson note generated
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={discard}
                className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={backToList}
                className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
              >
                Save & list
              </button>
              <button
                type="button"
                onClick={saveAndView}
                className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Save & view
              </button>
            </div>
          </div>
          <LessonNoteRender content={note.content} />
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link
            href="/dashboard/lessons"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to lesson notes
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">
          AI lesson note
        </p>
        {children}
      </div>
    </div>
  )
}

// Lightweight render of the structured lesson note JSON.
export function LessonNoteRender({ content }: { content: Record<string, unknown> }) {
  const get = <T,>(k: string): T | undefined => content[k] as T | undefined
  const objectives = get<string[]>('behaviouralObjectives') || []
  const materials  = get<string[]>('instructionalMaterials') || []
  const evaluation = get<string[]>('evaluation') || []
  const reading    = get<string[]>('suggestedReading') || []
  const presentation = get<Array<{
    step: number; title: string; duration: number;
    teacherActivity: string; pupilActivity: string;
  }>>('presentation') || []

  return (
    <article className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight">
          {String(get<string>('title') ?? 'Untitled lesson')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String(get<string>('subject') ?? '')} · {String(get<string>('class') ?? '')}
          {get<number>('week') != null && ` · Week ${get<number>('week')}`}
          {' · '}{get<number>('duration') ?? 40} minutes
        </p>
      </header>

      <Section title="Behavioural objectives">
        <ol className="list-decimal pl-5 space-y-1.5 text-sm">
          {objectives.map((o, i) => <li key={i}>{o}</li>)}
        </ol>
      </Section>

      <Section title="Previous knowledge">
        <p className="text-sm leading-relaxed">{String(get<string>('previousKnowledge') ?? '')}</p>
      </Section>

      <Section title="Instructional materials">
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          {materials.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </Section>

      <Section title="Presentation">
        <div className="space-y-4">
          {presentation.map((p, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <p className="font-medium">
                Step {p.step}: {p.title} <span className="text-muted-foreground text-xs">({p.duration} min)</span>
              </p>
              <p className="mt-2 text-sm"><strong>Teacher:</strong> {p.teacherActivity}</p>
              <p className="mt-1 text-sm"><strong>Pupils:</strong> {p.pupilActivity}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Chalkboard summary">
        <pre className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap font-sans">
          {String(get<string>('chalkboardSummary') ?? '')}
        </pre>
      </Section>

      <Section title="Evaluation">
        <ol className="list-decimal pl-5 space-y-1.5 text-sm">
          {evaluation.map((e, i) => <li key={i}>{e}</li>)}
        </ol>
      </Section>

      <Section title="Assignment">
        <p className="text-sm leading-relaxed">{String(get<string>('assignment') ?? '')}</p>
      </Section>

      <Section title="Suggested reading">
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          {reading.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}
