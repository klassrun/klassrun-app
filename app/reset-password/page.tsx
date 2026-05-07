'use client'

// app/reset-password/page.tsx
//
// Public page where users complete the password reset by setting a new
// password. The reset token comes in the URL: ?token=xyz
//
// Wrapped in <Suspense> because it reads useSearchParams() — required by
// Next.js 16 prerender.

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

export default function ResetPasswordPage() {
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
        <Suspense fallback={<ResetSkeleton />}>
          <ResetForm />
        </Suspense>
      </main>
    </div>
  )
}

function ResetForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword]       = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  if (!token) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-6 text-sm text-destructive">
        <p className="font-medium">Missing reset token</p>
        <p className="mt-1 text-destructive/80">
          This page needs a token from your reset email. Please use the link sent to your inbox, or{' '}
          <Link href="/forgot-password" className="underline font-medium">request a new one</Link>.
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
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error?.message || 'Could not reset password. Please try again.')
        setSubmitting(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-medium tracking-tight">
            Password reset
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
        </div>
        <div className="pt-4">
          <Button asChild size="lg" className="w-full h-11 text-base">
            <Link href="/login">Sign in →</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password you don&apos;t use anywhere else.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
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
          <Label htmlFor="confirmPw">Confirm new password</Label>
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
          {submitting ? 'Resetting…' : 'Reset password'}
        </Button>

        <p className="pt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </>
  )
}

function ResetSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-12 rounded bg-muted/50 animate-pulse" />
      <div className="h-16 rounded bg-muted/50 animate-pulse" />
      <div className="h-16 rounded bg-muted/50 animate-pulse" />
      <div className="h-11 rounded bg-muted/50 animate-pulse" />
    </div>
  )
}
