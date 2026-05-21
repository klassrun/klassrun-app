'use client'
// app/dashboard/lessons/lessons-client.tsx
// batch-3-phase-1-lessons-list-client

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

type Note = {
  id: string
  topic: string
  week: number | null
  sessionStamp: string
  createdAt: string
  subject: { id: string; name: string } | null
  class:   { id: string; name: string; level: string | null } | null
}

export function LessonsClient({
  initialNotes,
  initialError,
}: {
  initialNotes: Note[]
  initialError: string | null
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(note: Note) {
    if (!confirm(`Delete "${note.topic}"? You can't undo this.`)) return
    setDeleting(note.id)
    const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' })
    setDeleting(null)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      toast.error(body?.error?.message || 'Could not delete lesson note')
      return
    }
    toast.success('Lesson note deleted')
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    startTransition(() => router.refresh())
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <div className="mb-10 flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              AI lesson notes
            </p>
            <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
              Your lesson notes
            </h1>
          </div>
          <Link
            href="/dashboard/lessons/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New lesson note
          </Link>
        </div>

        {initialError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {initialError}
          </div>
        )}

        {notes.length === 0 && !initialError && (
          <div className="rounded-xl border bg-card px-6 py-12 text-center">
            <p className="text-base text-muted-foreground">
              No lesson notes yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Click <span className="text-foreground font-medium">+ New lesson note</span> to generate your first.
            </p>
          </div>
        )}

        {notes.length > 0 && (
          <div className="overflow-hidden rounded-xl border bg-card divide-y">
            {notes.map((note) => (
              <div key={note.id} className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/lessons/${note.id}`}
                    className="block font-medium hover:text-primary transition-colors"
                  >
                    {note.topic}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.class?.name ?? 'Unknown class'} · {note.subject?.name ?? 'Unknown subject'}
                    {note.week != null && ` · Week ${note.week}`}
                    {' · '}{note.sessionStamp}
                    {' · '}{formatDate(note.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/lessons/${note.id}`}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    disabled={deleting === note.id}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {deleting === note.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
}
