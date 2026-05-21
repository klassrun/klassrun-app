// app/dashboard/lessons/page.tsx
// batch-3-phase-1-lessons-list-page

import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'
import { LessonsClient } from './lessons-client'

// batch-3-phase-1-5-force-dynamic
export const dynamic = 'force-dynamic'

type Note = {
  id: string
  topic: string
  week: number | null
  sessionStamp: string
  createdAt: string
  subject: { id: string; name: string } | null
  class:   { id: string; name: string; level: string | null } | null
}

export default async function LessonsPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login?next=/dashboard/lessons')

  const result = await apiFetch<{ notes: Note[] }>('/api/notes', { token })
  const notes = result.ok && result.data ? result.data.notes : []
  const error = !result.ok ? (result.error?.message ?? 'Could not load notes') : null

  return <LessonsClient initialNotes={notes} initialError={error} />
}
