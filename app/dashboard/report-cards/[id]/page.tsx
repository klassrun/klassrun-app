// app/dashboard/report-cards/[id]/page.tsx
// ops-1b-reportcards-detail-page
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { ReportCardView, type ReportCardRecord } from './report-card-view'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string; schoolId: string | null } }

export default async function ReportCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')
  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const { id } = await params

  const cardResult = await apiFetch<{ reportCard: ReportCardRecord }>(`/api/report-cards/${id}`, { token })
  if (!cardResult.ok || !cardResult.data?.reportCard) redirect('/dashboard/report-cards')

  return <ReportCardView card={cardResult.data.reportCard} />
}
