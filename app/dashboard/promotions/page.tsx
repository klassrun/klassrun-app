// app/dashboard/promotions/page.tsx
// ops-3b-promotions-page
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { PromotionsClient } from './promotions-client'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string; schoolId: string | null } }
type ClassItem = { id: string; name: string; level: string | null; archivedAt: string | null }
type SessionItem = { id: string; name: string; currentTerm: 'FIRST' | 'SECOND' | 'THIRD'; isCurrent: boolean }

export default async function PromotionsPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')
  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const [classesResult, sessionsResult] = await Promise.all([
    apiFetch<{ classes: ClassItem[] }>('/api/classes', { token }),
    apiFetch<{ sessions: SessionItem[] }>('/api/sessions', { token }),
  ])

  const classes = classesResult.ok ? (classesResult.data?.classes ?? []) : []
  const sessions = sessionsResult.ok ? (sessionsResult.data?.sessions ?? []) : []

  return <PromotionsClient classes={classes} sessions={sessions} />
}
