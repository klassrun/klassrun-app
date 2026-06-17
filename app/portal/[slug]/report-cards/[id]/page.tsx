// app/portal/[slug]/report-cards/[id]/page.tsx
// ops-5c-portal-reportcard-page
import { redirect, notFound } from 'next/navigation'
import { getPortalCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { PortalReportCardView } from './report-card-view'

export const dynamic = 'force-dynamic'

type CardResponse = {
  reportCard: {
    id: string
    term: string
    session: { id: string; name: string } | null
    lockedAt: string | null
    pdfUrl: string | null
    hasPdf: boolean
    snapshot: unknown
  }
}

export default async function PortalReportCardPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const token = await getPortalCookie()
  if (!token) redirect(`/portal/${slug}/login`)

  const res = await apiFetch<CardResponse>(`/api/portal/report-cards/${id}`, { token })
  if (!res.ok || !res.data) {
    if (res.status === 403) redirect(`/portal/${slug}/dashboard`)
    notFound()
  }

  return <PortalReportCardView slug={slug} card={res.data.reportCard} />
}
