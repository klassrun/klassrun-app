// app/dashboard/settings/score-breakdown/page.tsx
// grading-config-app-v1: how each subject's 100 marks are split. SCHOOL_ADMIN only.

import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { ScoreBreakdownClient, type BreakdownView } from './score-breakdown-client'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string } }

export default async function ScoreBreakdownPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')
  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const viewResult = await apiFetch<BreakdownView>('/api/schools/grading-config', { token })
  if (!viewResult.ok || !viewResult.data) redirect('/dashboard/settings')

  return <ScoreBreakdownClient initial={viewResult.data} />
}
