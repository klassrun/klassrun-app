// app/dashboard/billing/_components/billing-client.tsx
// gate2-billing-client
'use client'

import { useState } from 'react'

const PLAN_ORDER = ['starter', 'standard', 'premium'] as const
const PLAN_LABELS: Record<string, string> = { starter: 'Starter', standard: 'Standard', premium: 'Premium' }

function naira(kobo: number): string {
  return '₦' + (kobo / 100).toLocaleString('en-NG')
}

export function BillingClient({
  prices,
  currentPlan,
  status,
}: {
  prices: Record<string, number>
  currentPlan: string | null
  status: string | null
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function subscribe(plan: string) {
    setError(null)
    setLoading(plan)
    try {
      const res = await fetch('/api/billing/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.authorizationUrl) {
        setError(data?.error?.message || 'Could not start payment. Please try again.')
        setLoading(null)
        return
      }
      window.location.href = data.authorizationUrl
    } catch {
      setError('Network error. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to dashboard
        </a>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-tight">Subscribe</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose a plan for your school. Billed per term.</p>
        {status === 'TRIAL' && (
          <p className="mt-1 text-sm text-muted-foreground">You're currently on a free trial.</p>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const isCurrent = currentPlan === plan && status === 'ACTIVE'
            return (
              <div key={plan} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {PLAN_LABELS[plan]}
                </p>
                <p className="mt-3 font-display text-3xl font-medium">{naira(prices[plan] ?? 0)}</p>
                <p className="text-xs text-muted-foreground">per term</p>
                <div className="mt-6 flex-1" />
                {isCurrent ? (
                  <span className="rounded-lg border border-border bg-muted px-4 py-2 text-center text-sm font-medium text-muted-foreground">
                    Current plan
                  </span>
                ) : (
                  <button
                    onClick={() => subscribe(plan)}
                    disabled={loading !== null}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading === plan ? 'Starting…' : 'Pay'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
