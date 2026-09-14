// app/dashboard/behaviour/page.tsx
// ops-2b-behaviour-page
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { BehaviourClient } from './behaviour-client'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string; schoolId: string | null } }
type ClassItem = { id: string; name: string; archivedAt: string | null; classTeacherId?: string | null } // classteacher-app-v1
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }

export default async function BehaviourPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')
  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')
  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  // classteacher-app-v1: a class teacher may reach this page. The API is the real
  // boundary — it 403s a teacher who is not the class teacher for the class.
  if (role !== 'SCHOOL_ADMIN' && role !== 'TEACHER') redirect('/dashboard')

  const [classesResult, sessionsResult] = await Promise.all([
    apiFetch<{ classes: ClassItem[] }>('/api/classes', { token }),
    apiFetch<unknown>('/api/sessions', { token }),
  ])
  const allClasses = (classesResult.ok ? (classesResult.data?.classes ?? []) : []).filter((c) => !c.archivedAt)
  // classteacher-app-v1: a teacher only ever sees the classes they are class teacher
  // of. Showing the rest would just produce a 403 on Load roster.
  // The id is hoisted OUT of the callback on purpose: TypeScript narrows
  // meResult.data after the redirect guard above, but discards that narrowing
  // inside a closure (TS18047).
  const myUserId = meResult.data.user.id
  const classes = role === 'TEACHER'
    ? allClasses.filter((c) => c.classTeacherId === myUserId)
    : allClasses
  // A teacher with no class has nothing to do here.
  if (role === 'TEACHER' && classes.length === 0) redirect('/dashboard')
  const rawSessions = sessionsResult.ok ? sessionsResult.data : null
  const sessions: SessionItem[] = Array.isArray(rawSessions)
    ? (rawSessions as SessionItem[])
    : (((rawSessions as { sessions?: SessionItem[] } | null)?.sessions) ?? [])

  return <BehaviourClient classes={classes} sessions={sessions} />
}
