// app/dashboard/report-cards/page.tsx
// ops-1b-reportcards-page
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { ReportCardsClient } from './report-cards-client'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string; schoolId: string | null } }
type ClassItem = { id: string; name: string; archivedAt: string | null }
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }
export type ReportCardListItem = {
  id: string
  student: { id: string; admissionNumber: string; firstName: string; middleName: string | null; lastName: string }
  session: { id: string; name: string }
  term: 'FIRST' | 'SECOND' | 'THIRD'
  pdfUrl: string | null
  lockedAt: string | null
  summary: { average: number; overallPosition: number | null; classSize: number; subjectsCount: number } | null
  createdAt: string
}

export default async function ReportCardsPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')
  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const [classesResult, sessionsResult, cardsResult] = await Promise.all([
    apiFetch<{ classes: ClassItem[] }>('/api/classes', { token }),
    apiFetch<unknown>('/api/sessions', { token }),
    apiFetch<{ reportCards: ReportCardListItem[] }>('/api/report-cards', { token }),
  ])

  const classes = (classesResult.ok ? (classesResult.data?.classes ?? []) : []).filter((c) => !c.archivedAt)
  const rawSessions = sessionsResult.ok ? sessionsResult.data : null
  const sessions: SessionItem[] = Array.isArray(rawSessions)
    ? (rawSessions as SessionItem[])
    : (((rawSessions as { sessions?: SessionItem[] } | null)?.sessions) ?? [])
  const cards = cardsResult.ok ? (cardsResult.data?.reportCards ?? []) : []

  return <ReportCardsClient classes={classes} sessions={sessions} initialCards={cards} />
}
