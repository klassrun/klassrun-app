// lib/subscription-status.ts
// b2-subscription-status
//
// ONE place that derives a human subscription state from the raw
// { status, endDate, trialEndsAt } the API returns. The admin schools pill,
// the dashboard banner, and (eventually) anything else all read from here so
// they can never disagree the way the old inline checks did - the schools
// table used to call a lapsed paid school "Active" while the billing page
// computed its own separate `expired`.
//
// This MIRRORS the API's plan-gate.js / billing-gate.js exactly:
//   - paid states (ACTIVE / PAST_DUE) are live while endDate + GRACE is future
//   - trials end HARD at trialEndsAt (no grace)
//   - computed on read, no cron
//
// GRACE_DAYS is duplicated from the server's BILLING_GRACE_DAYS (default 3).
// The browser cannot read server env, so if that env is ever retuned this
// constant must be changed to match by hand - the same limitation the billing
// page already lives with.

export const GRACE_DAYS = 3
export const WARN_DAYS = 3 // "ending soon" window before endDate / trialEndsAt

export type SubShape = {
  status: string
  endDate?: string | null
  trialEndsAt?: string | null
} | null

export type DerivedState =
  | 'trial'          // trialing, comfortably before the end
  | 'trial-ending'   // trialing, within WARN_DAYS of trialEndsAt
  | 'trial-expired'  // trial ended (hard, no grace)
  | 'active'         // paid, comfortably live
  | 'active-ending'  // paid, within WARN_DAYS of endDate
  | 'grace'          // past endDate, still within GRACE_DAYS
  | 'lapsed'         // past endDate + grace: API will freeze writes
  | 'suspended'      // school suspended by super admin
  | 'none'           // no subscription row / unknown

export type Derived = {
  state: DerivedState
  daysLeft: number | null // whole days until the relevant edge; negative once past
  graceDayOf: number | null // for 'grace': which day of GRACE_DAYS we are on (1..GRACE_DAYS)
  endDate: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

// Whole days from now to `iso`. Positive = future, negative = past. null if unusable.
function daysUntil(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return Math.ceil((t - now) / DAY_MS)
}

export function deriveSubscriptionState(
  sub: SubShape,
  schoolStatus?: string | null,
  nowMs?: number,
): Derived {
  const now = nowMs ?? Date.now()

  if (schoolStatus === 'SUSPENDED') {
    return { state: 'suspended', daysLeft: null, graceDayOf: null, endDate: sub?.endDate ?? null }
  }
  if (!sub || !sub.status) {
    return { state: 'none', daysLeft: null, graceDayOf: null, endDate: null }
  }

  const status = sub.status.toUpperCase()

  if (status === 'TRIAL') {
    const d = daysUntil(sub.trialEndsAt, now)
    if (d === null) return { state: 'trial', daysLeft: null, graceDayOf: null, endDate: null }
    if (d < 0) return { state: 'trial-expired', daysLeft: d, graceDayOf: null, endDate: sub.trialEndsAt ?? null }
    if (d <= WARN_DAYS) return { state: 'trial-ending', daysLeft: d, graceDayOf: null, endDate: sub.trialEndsAt ?? null }
    return { state: 'trial', daysLeft: d, graceDayOf: null, endDate: sub.trialEndsAt ?? null }
  }

  if (status === 'ACTIVE' || status === 'PAST_DUE') {
    const d = daysUntil(sub.endDate, now)
    if (d === null) return { state: 'active', daysLeft: null, graceDayOf: null, endDate: null }
    if (d > WARN_DAYS) return { state: 'active', daysLeft: d, graceDayOf: null, endDate: sub.endDate ?? null }
    if (d >= 0) return { state: 'active-ending', daysLeft: d, graceDayOf: null, endDate: sub.endDate ?? null }
    // Past endDate. Within grace?
    if (-d <= GRACE_DAYS) {
      return { state: 'grace', daysLeft: d, graceDayOf: Math.min(GRACE_DAYS, -d), endDate: sub.endDate ?? null }
    }
    return { state: 'lapsed', daysLeft: d, graceDayOf: null, endDate: sub.endDate ?? null }
  }

  if (status === 'EXPIRED' || status === 'CANCELLED') {
    return { state: 'lapsed', daysLeft: null, graceDayOf: null, endDate: sub.endDate ?? null }
  }

  return { state: 'none', daysLeft: null, graceDayOf: null, endDate: sub.endDate ?? null }
}

// Short label + tone for the admin schools pill.
export function pillFor(d: Derived): { label: string; tone: 'ok' | 'warn' | 'bad' | 'muted' } {
  switch (d.state) {
    case 'active': return { label: 'Active', tone: 'ok' }
    case 'active-ending': return { label: d.daysLeft === 0 ? 'Ends today' : `Ends in ${d.daysLeft}d`, tone: 'warn' }
    case 'grace': return { label: `Grace ${d.graceDayOf}/${GRACE_DAYS}`, tone: 'bad' }
    case 'lapsed': return { label: 'Lapsed', tone: 'bad' }
    case 'trial': return { label: 'Trial', tone: 'muted' }
    case 'trial-ending': return { label: d.daysLeft === 0 ? 'Trial ends today' : `Trial ${d.daysLeft}d`, tone: 'warn' }
    case 'trial-expired': return { label: 'Trial ended', tone: 'bad' }
    case 'suspended': return { label: 'Suspended', tone: 'bad' }
    default: return { label: 'No plan', tone: 'muted' }
  }
}
