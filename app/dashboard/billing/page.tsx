// app/dashboard/billing/page.tsx
// gate2-billing-page
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { BillingClient } from './_components/billing-client'

export const dynamic = 'force-dynamic'

type PlansResp = { prices: Record<string, number>; currency: string }
type MeResp = {
  user: {
    role: string
    school: { subscription: { plan: string; status: string } | null } | null
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
  const prices = plansR.data?.prices ?? { starter: 4000000, standard: 6000000, premium: 15000000 }
  const currentPlan = user.school?.subscription?.plan ?? null
  const status = user.school?.subscription?.status ?? null

  return <BillingClient prices={prices} currentPlan={currentPlan} status={status} />
}
