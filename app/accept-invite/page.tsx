'use client'

// app/accept-invite/page.tsx
//
// Public page where invited teachers set their password and accept their
// school invitation. Token comes via ?token=xyz in the URL.

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun" width={40} height={40}
              className="h-10 w-auto" unoptimized
            />
            <span className="font-display text-xl font-semibold tracking-tight">
              Klassrun
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-16 sm:px-8">
        <Suspense fallback={<InviteSkeleton />}>
          <AcceptForm />
        </Suspense>
      </main>
    </div>
  )
}

function AcceptForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword]     = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  if (!token) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-6 text-sm text-destructive">
        <p className="font-medium">Missing invite token</p>
        <p className="mt-1 text-destructive/80">
          This page needs a token from your invite email. Please use the link sent to your inbox.
        </p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPw) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/auth/invite/${encodeURIComponent(token!)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error?.message || 'Could not accept invite. The link may be expired.')
        setSubmitting(false)
        return
      }

      // Cookie is set by the route handler — hard navigate so it propagates
      window.location.href = '/dashboard'
    } catch {
      setError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Set up your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a password to finish setting up your Klassrun account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">At least 8 characters</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPw">Confirm password</Label>
          <PasswordInput
            id="confirmPw"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full h-11 text-base"
        >
          {submitting ? 'Setting up…' : 'Set up my account'}
        </Button>
      </form>
    </>
  )
}

function InviteSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-12 rounded bg-muted/50 animate-pulse" />
      <div className="h-16 rounded bg-muted/50 animate-pulse" />
      <div className="h-16 rounded bg-muted/50 animate-pulse" />
      <div className="h-11 rounded bg-muted/50 animate-pulse" />
    </div>
  )
}
