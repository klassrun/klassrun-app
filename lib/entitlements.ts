// lib/entitlements.ts
// entitlements-app-v1: what the API says this school can do. The app only
// REFLECTS this — the API gate is the boundary (house rule: proxy stays
// role-based). Nothing is shown until enforcement is actually on.

export type Entitlements = {
  enforced: boolean
  role: string
  tier: 'starter' | 'standard' | 'premium'
  inTrial: boolean
  trialEndsAt: string | null
  readOnly: boolean
  readOnlyReason: 'TRIAL_ENDED' | 'EXPIRED' | 'NO_SUBSCRIPTION' | null
  features: Record<string, boolean>
  featureTiers: Record<string, string>
}

export const FEATURE_LABEL: Record<string, string> = {
  AI_EXAMS: 'Exam question generation',
  QUESTION_BANK: 'The question bank',
  AI_COMMENTS: 'AI report-card comments',
  FEES: 'Fees',
  SCHEME_UPLOAD: 'Scheme-of-work upload',
  BRANDING: 'School letterhead',
}

// Longest prefix first, so /report-cards/comments wins over /report-cards.
const PATH_FEATURES: Array<[string, string]> = [
  ['/dashboard/report-cards/comments', 'AI_COMMENTS'],
  ['/dashboard/schemes/upload', 'SCHEME_UPLOAD'],
  ['/dashboard/question-bank', 'QUESTION_BANK'],
  ['/dashboard/assessments', 'AI_EXAMS'],
  ['/dashboard/fees', 'FEES'],
]

export function featureForPath(pathname: string): string | null {
  for (const [prefix, feature] of PATH_FEATURES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return feature
  }
  return null
}

export function tierLabel(tier: string | undefined): string {
  return tier === 'premium' ? 'Premium' : tier === 'standard' ? 'Standard' : 'Starter'
}

// Feature -> the tier label it needs, for every feature this school LACKS.
// Empty until enforcement is on, so nothing changes in observe mode.
export function lockedTiers(ent: Entitlements | null): Record<string, string> {
  if (!ent || !ent.enforced) return {}
  const out: Record<string, string> = {}
  for (const [f, allowed] of Object.entries(ent.features)) {
    if (!allowed) out[f] = tierLabel(ent.featureTiers[f])
  }
  return out
}
