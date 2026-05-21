// app/dashboard/lessons/[id]/page.tsx
// batch-3-phase-1-lessons-detail-page

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'
import { LessonNoteRender } from '../new/new-lesson-client'

type Note = {
  id: string
  topic: string
  content: Record<string, unknown>
  sessionStamp: string
  createdAt: string
  teacher: { firstName: string; lastName: string; email: string } | null
  subject: { name: string } | null
  class:   { name: string; level: string | null } | null
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const { id } = await params
  const result = await apiFetch<{ note: Note }>(`/api/notes/${id}`, { token })
  if (!result.ok || !result.data?.note) notFound()
  const note = result.data.note

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
        <LessonNoteRender content={note.content} />
      </div>
    </div>
  )
}
