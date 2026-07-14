'use client'
// app/dashboard/lessons/new/new-lesson-client.tsx
// batch-3-phase-1-lessons-new-client

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
// batch-3-phase-1-5-extracted-render
import { LessonNoteRender } from '../_components/lesson-note-render'

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
  // batch-3-phase-1-5-subtopics-state
  const [subTopicsText, setSubTopicsText] = useState('')

  const [stage, setStage] = useState<Stage>('SELECTING')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<LessonNote | null>(null)
  // bugfix-dedup-copy-v1
  const [duplicate, setDuplicate] = useState<{ id: string; topic: string; createdAt: string } | null>(null)

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
    setDuplicate(null) // bugfix-dedup-copy-v1
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
    // batch-3-phase-1-5-subtopics-body
    const subTopics = subTopicsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 10)
    if (subTopics.length > 0) body.subTopics = subTopics

    const res = await fetch('/api/notes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      // bugfix-dedup-copy-v1: duplicate guard fired on the API
      if (res.status === 409 && data?.error?.code === 'DUPLICATE_NOTE' && data?.existingNote) {
        setDuplicate(data.existingNote)
        setStage('SELECTING')
        return
      }
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

  // bugfix-dedup-copy-v1
  async function deleteAndRegenerate() {
    if (!duplicate) return
    const res = await fetch(`/api/notes/${duplicate.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setDuplicate(null)
      setError(body?.error?.message || 'Could not delete the existing note')
      return
    }
    setDuplicate(null)
    generate()
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

            {/* batch-3-phase-1-5-subtopics-ui */}
            <div>
              <label htmlFor="subtopics" className="block text-xs font-medium text-foreground">
                Sub-topics (optional, one per line)
              </label>
              <textarea
                id="subtopics"
                rows={3}
                value={subTopicsText}
                onChange={(e) => setSubTopicsText(e.target.value)}
                placeholder={"e.g.\nIn plants\nIn animals\nThe energy conversion"}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The AI will use these sub-topics as section headers, in the order you list them.
                Leave blank to let the AI decide the structure.
              </p>
            </div>

            {/* bugfix-dedup-copy-v1: duplicate-note resolution card */}
            {duplicate && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">This note already exists</p>
                <p className="mt-1">
                  &quot;{duplicate.topic}&quot; was created for this class, subject and term on{' '}
                  {new Date(duplicate.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })}.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/lessons/${duplicate.id}`)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Open existing
                  </button>
                  <button
                    type="button"
                    onClick={deleteAndRegenerate}
                    className="rounded-md border border-amber-400 bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Delete old &amp; regenerate
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicate(null)}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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
