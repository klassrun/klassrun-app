'use client'

// app/(auth)/login/page.tsx
//
// Sign in. Refined two-column layout matching signup.
//
// Next.js 16 note: useSearchParams() must live inside a <Suspense> boundary
// or the production build refuses to prerender. We split LoginPage into
// a thin Suspense wrapper + a LoginForm child that reads the params.

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
        {/* ── Left rail ─────────────────────────────────────────── */}
        <aside className="relative hidden flex-col justify-between bg-secondary p-12 lg:flex">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun"
              width={48} height={48}
              className="h-12 w-auto"
              unoptimized
            />
            <span className="font-display text-xl font-semibold tracking-tight">
              Klassrun
            </span>
          </Link>

          <p className="font-display text-3xl leading-snug tracking-tight">
            Welcome back. Your school has been{' '}
            <span className="font-display-wonky italic text-primary">waiting.</span>
          </p>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Klassrun Technologies Ltd · RC 9463863
          </p>
        </aside>

        {/* ── Form pane ─────────────────────────────────────────── */}
        <main className="flex flex-col px-6 py-12 sm:px-12 lg:px-16 lg:py-16">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun" width={40} height={40}
              className="h-10 w-auto" unoptimized
            />
            <span className="font-display text-lg font-semibold">Klassrun</span>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 space-y-2">
              <h1 className="font-display text-3xl font-medium tracking-tight">
                Sign in
              </h1>
              <p className="text-sm text-muted-foreground">
                New to Klassrun?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Create your school
                </Link>
              </p>
            </div>

            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

// ── LoginForm — uses useSearchParams, must be inside <Suspense> ─────────
function LoginForm() {
  const search = useSearchParams()
  const next   = search.get('next')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.error?.message || 'Login failed')
        setSubmitting(false)
        return
      }

      // Decide where to send the user based on role + next param
      let destination = next || '/dashboard'
      if (!next && data?.user?.role === 'SUPER_ADMIN') {
        destination = '/admin'
      }

      // HARD redirect so the cookie attaches to the next request
      window.location.href = destination
    } catch {
      setError('Network error. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email" type="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          required autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          required autoComplete="current-password"
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
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-16 rounded-lg bg-muted/50 animate-pulse" />
      <div className="h-16 rounded-lg bg-muted/50 animate-pulse" />
      <div className="h-11 rounded-lg bg-muted/50 animate-pulse" />
    </div>
  )
}
