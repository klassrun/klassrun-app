// app/dashboard/billing/page.tsx
// gate2-billing-page + pay2-hardening-v1
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { BillingClient } from './_components/billing-client'

export const dynamic = 'force-dynamic'

type PlansResp = { prices: Record<string, number>; currency: string; periodDays?: number; periodLabel?: string; lockedPlan?: string | null }
type MeResp = {
  user: {
    role: string
    school: { subscription: { plan: string; status: string; endDate?: string | null } | null } | null
  }
}

export default async function BillingPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meR = await apiFetch<MeResp>('/api/auth/me', { token })
  const user = meR.data?.user
  if (!user) redirect('/login')
  if (user.role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const plansR = await apiFetch<PlansResp>('/api/billing/plans', { token })
  const prices = plansR.data?.prices ?? { starter: 2000000, standard: 3500000, premium: 5500000 } // subscribe-lockedplan-v1: repriced fallback (only shows if /plans fails)
  const periodLabel = plansR.data?.periodLabel ?? 'month'
  const lockedPlan = plansR.data?.lockedPlan ?? null // subscribe-lockedplan-v1
  const sub = user.school?.subscription ?? null
  const currentPlan = sub?.plan ?? null
  const status = sub?.status ?? null
  // pay2-hardening-v1: a lapsed school must be able to renew its own plan.
  // The "Current plan" lock only applies while paid time genuinely remains.
  const expired = status === 'ACTIVE' && !!sub?.endDate && new Date(sub.endDate as string).getTime() < Date.now()

  return <BillingClient prices={prices} currentPlan={currentPlan} status={status} expired={expired} periodLabel={periodLabel} lockedPlan={lockedPlan} />
}
