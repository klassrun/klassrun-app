'use client'
// app/dashboard/_components/gate-bar.tsx
// entitlements-app-v1
//
//  • READ-ONLY school -> a red bar on every page. Admins get a Subscribe link;
//    teachers are told to ask their admin (they cannot pay). Skipped on the
//    admin dashboard home and billing page, which already say it.
//  • Page whose feature the plan lacks -> an amber panel. The page still renders,
//    so anything made during the free trial stays readable.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { featureForPath, FEATURE_LABEL, tierLabel, type Entitlements } from '@/lib/entitlements'

export function GateBar({ ent }: { ent: Entitlements }) {
  const pathname = usePathname() || ''
  if (ent.role === 'SUPER_ADMIN') return null
  const isAdmin = ent.role === 'SCHOOL_ADMIN'

  if (ent.readOnly) {
    if (isAdmin && (pathname === '/dashboard' || pathname.startsWith('/dashboard/billing'))) return null
    const why = ent.readOnlyReason === 'TRIAL_ENDED' ? 'The free trial has ended' : 'The subscription has ended'
    return (
      <div className="border-b border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm sm:px-8">
          <p>
            <span className="font-medium">{why} — Klassrun is view-only.</span>{' '}
            Everything already created is safe and readable{isAdmin ? '.' : '. Ask your school admin to renew so you can save again.'}
          </p>
          {isAdmin && (
            <Link href="/dashboard/billing" className="shrink-0 rounded-lg border border-current/30 bg-background/40 px-3 py-1.5 text-xs font-semibold hover:bg-background/60 transition-colors">
              Subscribe →
            </Link>
          )}
        </div>
      </div>
    )
  }

  const feature = featureForPath(pathname)
  if (feature && ent.features[feature] === false) {
    const tier = tierLabel(ent.featureTiers[feature])
    const label = FEATURE_LABEL[feature] ?? 'This feature'
    return (
      <div className="border-b border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm sm:px-8">
          <p>
            <span className="font-medium">{label} is part of the {tier} plan.</span>{' '}
            Anything made during the free trial is still here to view; creating new ones needs {tier}.
            {isAdmin ? '' : ' Ask your school admin about upgrading.'}
          </p>
          {isAdmin && (
            <Link href="/dashboard/billing" className="shrink-0 rounded-lg border border-current/30 bg-background/40 px-3 py-1.5 text-xs font-semibold hover:bg-background/60 transition-colors">
              See plans →
            </Link>
          )}
        </div>
      </div>
    )
  }
  return null
}
