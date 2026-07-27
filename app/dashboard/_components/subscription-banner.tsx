// app/dashboard/_components/subscription-banner.tsx
// b2-subscription-banner
//
// Non-interactive status banner shown above the SCHOOL_ADMIN dashboard. It
// only REFLECTS the subscription state the API already computes - it never
// enforces anything (the API gate does that; proxy.ts stays role-based, not
// plan-based, per house rule #41). Healthy active + comfortable trial render
// nothing, so the common case is invisible.

import Link from 'next/link'
import { deriveSubscriptionState, type SubShape } from '@/lib/subscription-status'

type Tone = 'amber' | 'red'

const TONE_CLASS: Record<Tone, string> = {
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200',
  red: 'border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200',
}

export function SubscriptionBanner({
  subscription,
  schoolStatus,
}: {
  subscription: SubShape
  schoolStatus?: string | null
}) {
  const d = deriveSubscriptionState(subscription, schoolStatus)

  let tone: Tone | null = null
  let message = ''
  let cta = 'Subscribe'

  switch (d.state) {
    case 'active-ending':
      tone = 'amber'
      message =
        d.daysLeft === 0
          ? 'Your subscription ends today. Renew now to avoid interruption.'
          : `Your subscription ends in ${d.daysLeft} day${d.daysLeft === 1 ? '' : 's'}. Renew to avoid interruption.`
      cta = 'Renew now'
      break
    case 'grace': {
      tone = 'red'
      const left = Math.max(0, 3 - (d.graceDayOf ?? 3) + 1)
      message = `Your subscription ended. You have ${left} day${left === 1 ? '' : 's'} of grace before your account becomes view-only.`
      cta = 'Renew now'
      break
    }
    case 'lapsed':
      tone = 'red'
      message = 'Your account is view-only. Subscribe to start creating content again.'
      cta = 'Subscribe'
      break
    case 'trial-ending':
      tone = 'amber'
      message =
        d.daysLeft === 0
          ? 'Your free trial ends today. Subscribe to keep your work active.'
          : `Your free trial ends in ${d.daysLeft} day${d.daysLeft === 1 ? '' : 's'}. Subscribe to keep creating content.`
      cta = 'Choose a plan'
      break
    case 'trial-expired':
      tone = 'red'
      message = 'Your free trial has ended. Your work is safe and readable - subscribe to create new content.'
      cta = 'Choose a plan'
      break
    default:
      return null // active / trial / suspended / none -> no banner
  }

  return (
    <div className={`mx-auto mb-6 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${TONE_CLASS[tone]}`}>
      <p className="font-medium">{message}</p>
      <Link
        href="/dashboard/billing"
        className="shrink-0 rounded-lg border border-current/30 bg-background/40 px-3 py-1.5 text-xs font-semibold hover:bg-background/60 transition-colors"
      >
        {cta} →
      </Link>
    </div>
  )
}
