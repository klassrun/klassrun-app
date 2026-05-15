// app/dashboard/academic/page.tsx
//
// Sessions & terms management. SCHOOL_ADMIN only.
// Middleware enforces; this page redirects defensively.
//
// batch-2c-phase-1-academic-page

import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { AcademicClient } from './academic-client'

type MeResponse = {
  user: {
    id: string
    email: string
    role: string
  }
}

export type AcademicSession = {
  id: string
  name: string
  currentTerm: 'FIRST' | 'SECOND' | 'THIRD'
  isCurrent: boolean
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export default async function AcademicPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data) redirect('/login')

  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const sessionsResult = await apiFetch<{ sessions: AcademicSession[] }>('/api/sessions', { token })
  const sessions = sessionsResult.ok ? sessionsResult.data?.sessions ?? [] : []

  return <AcademicClient initialSessions={sessions} />
}
