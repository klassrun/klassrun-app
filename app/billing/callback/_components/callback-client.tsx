// app/billing/callback/_components/callback-client.tsx
// gate2-callback-client
'use client'

import { useEffect, useState } from 'react'

const PLAN_LABELS: Record<string, string> = { starter: 'Starter', standard: 'Standard', premium: 'Premium' }

export function CallbackClient({ reference }: { reference: string }) {
  const [state, setState] = useState<'checking' | 'success' | 'pending' | 'error'>('checking')
  const [plan, setPlan] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)

  useEffect(() => {
    if (!reference) {
      setState('error')
      return
    }
    let tries = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      tries++
      try {
        const res = await fetch(`/api/billing/verify/${encodeURIComponent(reference)}`)
        const data = await res.json().catch(() => ({}))
        if (data.paid && data.status === 'ACTIVE') {
          setPlan(data.plan ?? null)
          setEndDate(data.endDate ?? null)
          setState('success')
          return
        }
      } catch {
        /* keep polling */
      }
      if (tries >= 6) {
        setState('pending')
        return
      }
      timer = setTimeout(poll, 2500)
    }

    poll()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [reference])

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        {state === 'checking' && (
          <>
            <h1 className="font-display text-2xl font-medium">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-muted-foreground">This only takes a moment.</p>
          </>
        )}
        {state === 'success' && (
          <>
            <h1 className="font-display text-2xl font-medium">You're all set</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your school is now on the{' '}
              <span className="font-medium text-foreground">{plan ? PLAN_LABELS[plan] ?? plan : 'new'}</span> plan
              {endDate ? <> until {new Date(endDate).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</> : null}.
            </p>
            <a href="/dashboard" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
              Go to dashboard
            </a>
          </>
        )}
        {state === 'pending' && (
          <>
            <h1 className="font-display text-2xl font-medium">Payment received</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We're still confirming it. If your plan doesn't update shortly, refresh the dashboard or contact support.
            </p>
            <a href="/dashboard" className="mt-6 inline-block rounded-lg border border-border bg-background px-5 py-2 text-sm font-medium transition hover:bg-muted">
              Back to dashboard
            </a>
          </>
        )}
        {state === 'error' && (
          <>
            <h1 className="font-display text-2xl font-medium">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't read your payment reference. If you were charged, contact support and we'll sort it out.
            </p>
            <a href="/dashboard/billing" className="mt-6 inline-block rounded-lg border border-border bg-background px-5 py-2 text-sm font-medium transition hover:bg-muted">
              Back to plans
            </a>
          </>
        )}
      </div>
    </div>
  )
}
