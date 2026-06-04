// app/dashboard/report-cards/comments/page.tsx
// ops-2b-comments-page
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { CommentsClient } from './comments-client'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string; schoolId: string | null } }
type ClassItem = { id: string; name: string; archivedAt: string | null }
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }

export default async function CommentsPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')
  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')
  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const [classesResult, sessionsResult] = await Promise.all([
    apiFetch<{ classes: ClassItem[] }>('/api/classes', { token }),
    apiFetch<unknown>('/api/sessions', { token }),
  ])
  const classes = (classesResult.ok ? (classesResult.data?.classes ?? []) : []).filter((c) => !c.archivedAt)
  const rawSessions = sessionsResult.ok ? sessionsResult.data : null
  const sessions: SessionItem[] = Array.isArray(rawSessions)
    ? (rawSessions as SessionItem[])
    : (((rawSessions as { sessions?: SessionItem[] } | null)?.sessions) ?? [])

  return <CommentsClient classes={classes} sessions={sessions} />
}
