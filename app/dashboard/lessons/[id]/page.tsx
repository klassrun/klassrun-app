// app/dashboard/lessons/[id]/page.tsx
// batch-3-phase-1-lessons-detail-page
// batch-5-print-export

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'
// batch-3-phase-1-5-detail-import
import { LessonNoteRender } from '../_components/lesson-note-render'
import { ExportButton, PrintHeader } from '../../_components/print-export'

// batch-3-phase-1-5-force-dynamic
export const dynamic = 'force-dynamic'

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

type MeSchool = { name: string; logoUrl: string | null } | null

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const { id } = await params
  const [result, meResult] = await Promise.all([
    apiFetch<{ note: Note }>(`/api/notes/${id}`, { token }),
    apiFetch<{ user: { school: MeSchool } }>('/api/auth/me', { token }),
  ])
  if (!result.ok || !result.data?.note) notFound()
  const note = result.data.note
  const school = (meResult.ok && meResult.data?.user?.school) || null

  const printTitle = String((note.content as Record<string, unknown>)?.title ?? note.topic ?? 'Lesson note')
  const printSubtitle = [note.subject?.name, note.class?.name, note.sessionStamp]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link
            href="/dashboard/lessons"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to lesson notes
          </Link>
          <ExportButton filename={`${printTitle} - Lesson Note`} />
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:py-16 print:py-0">
        <PrintHeader
          school={school}
          documentKind="Lesson Note"
          title={printTitle}
          subtitle={printSubtitle}
        />
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary print:hidden">
          AI lesson note
        </p>
        <LessonNoteRender content={note.content} />
      </div>
    </div>
  )
}
