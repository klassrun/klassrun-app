'use client'

// app/(auth)/login/page.tsx
//
// Sign in. Refined two-column layout matching signup. The auth cookie is
// set by /api/auth/login route handler; we then HARD-redirect so the
// browser re-requests with the new cookie attached.
//
// Role-aware redirect:
//   SUPER_ADMIN → /admin
//   everyone else → /dashboard (or ?next= if provided)

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

export default function LoginPage() {
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

      // HARD redirect — not router.push — so cookie attaches to next request
      window.location.href = destination
    } catch {
      setError('Network error. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between bg-[oklch(0.97_0.01_145)] p-12 lg:flex">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun"
              width={48} height={48}
              className="h-12 w-auto"
              unoptimized
            />
            <span className="font-heading text-xl font-semibold tracking-tight">
              Klassrun
            </span>
          </Link>

          <p className="font-heading text-3xl leading-snug tracking-tight text-foreground">
            Welcome back. Your school has been waiting.
          </p>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Klassrun Technologies Ltd · RC 9463863
          </p>
        </aside>

        <main className="flex flex-col px-6 py-12 sm:px-12 lg:px-16 lg:py-16">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun" width={40} height={40}
              className="h-10 w-auto" unoptimized
            />
            <span className="font-heading text-lg font-semibold">Klassrun</span>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 space-y-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                Sign in
              </h1>
              <p className="text-sm text-muted-foreground">
                New to Klassrun?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Create your school
                </Link>
              </p>
            </div>

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
          </div>
        </main>
      </div>
    </div>
  )
}
