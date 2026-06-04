// app/dashboard/results/page.tsx
// ops-1b-results-page
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { ResultsClient } from './results-client'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string; schoolId: string | null } }
type Assignment = {
  class: { id: string; name: string; level: string | null }
  subjects: Array<{ id: string; name: string; archivedAt: string | null; createdAt: string }>
}
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }
export type SubjectPair = { classId: string; className: string; subjectId: string; subjectName: string }

export default async function ResultsPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')
  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'TEACHER') redirect('/dashboard')

  const [assignmentsResult, sessionsResult] = await Promise.all([
    apiFetch<{ assignments: Assignment[] }>('/api/teachers/me/assignments', { token }),
    apiFetch<unknown>('/api/sessions', { token }),
  ])

  const assignments = assignmentsResult.ok ? (assignmentsResult.data?.assignments ?? []) : []
  const pairs: SubjectPair[] = []
  for (const a of assignments) {
    for (const s of a.subjects) {
      if (s.archivedAt) continue
      pairs.push({ classId: a.class.id, className: a.class.name, subjectId: s.id, subjectName: s.name })
    }
  }

  const rawSessions = sessionsResult.ok ? sessionsResult.data : null
  const sessions: SessionItem[] = Array.isArray(rawSessions)
    ? (rawSessions as SessionItem[])
    : (((rawSessions as { sessions?: SessionItem[] } | null)?.sessions) ?? [])

  return <ResultsClient pairs={pairs} sessions={sessions} />
}
