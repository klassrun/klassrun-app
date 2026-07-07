// app/billing/callback/_components/callback-client.tsx
// gate2-callback-client
// batch-6-callback-polish — retry + reference + clearer pending/failed copy
'use client'

import { useCallback, useEffect, useState } from 'react'

const PLAN_LABELS: Record<string, string> = { starter: 'Starter', standard: 'Standard', premium: 'Premium' }

export function CallbackClient({ reference }: { reference: string }) {
  const [state, setState] = useState<'checking' | 'success' | 'pending' | 'error'>('checking')
  const [plan, setPlan] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  const runVerify = useCallback(async () => {
    if (!reference) {
      setState('error')
      return
    }
    let tries = 0
    let settled = false

    async function poll(): Promise<void> {
      tries++
      try {
        const res = await fetch(`/api/billing/verify/${encodeURIComponent(reference)}`)
        const data = await res.json().catch(() => ({}))
        if (data.paid && data.status === 'ACTIVE') {
          setPlan(data.plan ?? null)
          setEndDate(data.endDate ?? null)
          setState('success')
          settled = true
          return
        }
      } catch {
        /* keep polling */
      }
      if (tries >= 6) {
        setState('pending')
        settled = true
        return
      }
      await new Promise((r) => setTimeout(r, 2500))
      if (!settled) return poll()
    }

    setState('checking')
    await poll()
  }, [reference])

  useEffect(() => {
    runVerify()
  }, [runVerify])

  const onRetry = useCallback(async () => {
    setRetrying(true)
    await runVerify()
    setRetrying(false)
  }, [runVerify])

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
              We've received your payment and are activating your account. This usually takes just a few seconds.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={onRetry}
                disabled={retrying}
                className="inline-block rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {retrying ? 'Checking…' : 'Check again'}
              </button>
              <a href="/dashboard" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
                Back to dashboard
              </a>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Still not active after a minute? Email{' '}
              <a href="mailto:support@klassrun.com" className="font-medium text-foreground hover:text-primary">support@klassrun.com</a>
              {reference ? <> with reference <span className="font-mono text-[11px] text-foreground">{reference}</span></> : null}.
            </p>
          </>
        )}
        {state === 'error' && (
          <>
            <h1 className="font-display text-2xl font-medium">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't confirm your payment reference. If you were charged, you have not lost your money — contact support and we'll sort it out.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              {reference && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={retrying}
                  className="inline-block rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {retrying ? 'Checking…' : 'Try again'}
                </button>
              )}
              <a href="/dashboard/billing" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
                Back to plans
              </a>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Email{' '}
              <a href="mailto:support@klassrun.com" className="font-medium text-foreground hover:text-primary">support@klassrun.com</a>
              {reference ? <> with reference <span className="font-mono text-[11px] text-foreground">{reference}</span></> : null}.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
