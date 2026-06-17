// app/portal/[slug]/dashboard/page.tsx
// ops-5c-portal-dashboard-page
import { redirect } from 'next/navigation'
import { getPortalCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { PortalDashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

type MeResponse = {
  student: { id: string; admissionNumber: string; firstName: string; lastName: string; className: string | null }
  school: { id: string; name: string | null; slug: string | null }
  currentSession: { id: string; name: string; currentTerm: string } | null
}
type Summary = { average?: number; aggregate?: number; overallPosition?: number; classSize?: number; cumulativeAverage?: number | null } | null
type Card = { id: string; term: string; session: { id: string; name: string } | null; sessionId: string; lockedAt: string | null; pdfUrl: string | null; hasPdf: boolean; summary: Summary }
type CardsResponse = { reportCards: Card[] }
type FeesResponse = { session: { id: string; name: string } | null; currentTerm: string | null; terms: Array<{ term: string; status: string }> }

export default async function PortalDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const token = await getPortalCookie()
  if (!token) redirect(`/portal/${slug}/login`)

  const meRes = await apiFetch<MeResponse>('/api/portal/me', { token })
  if (!meRes.ok || !meRes.data) {
    if (meRes.status === 403) {
      return (
        <div className="mx-auto max-w-md rounded-xl border border-amber-500/40 bg-amber-500/5 px-5 py-6 text-sm">
          <p className="font-display text-lg font-medium tracking-tight text-foreground">Access restricted</p>
          <p className="mt-2 text-muted-foreground">{meRes.error?.message ?? 'Please contact the school bursary.'}</p>
        </div>
      )
    }
    redirect(`/portal/${slug}/login`)
  }

  const me = meRes.data
  const [cardsRes, feesRes] = await Promise.all([
    apiFetch<CardsResponse>('/api/portal/report-cards', { token }),
    apiFetch<FeesResponse>('/api/portal/fees', { token }),
  ])

  return (
    <PortalDashboardClient
      slug={slug}
      me={me}
      reportCards={cardsRes.data?.reportCards ?? []}
      fees={feesRes.data ?? null}
    />
  )
}
