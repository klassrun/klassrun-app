'use client'

// app/forgot-password/page.tsx
//
// Public page where users request a password reset link.
//
// Always shows a "check your email" success state, even if the email
// doesn't exist — backend handles email enumeration protection.

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error?.message || 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      // Always show success — the backend deliberately doesn't tell us
      // if the email was registered.
      setSubmitted(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

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
        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-medium tracking-tight">
                Check your email
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                If <strong className="text-foreground">{email}</strong> is registered with Klassrun, you&apos;ll receive a password reset link shortly.
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground text-left">
              <p className="mb-2 font-medium text-foreground">Didn&apos;t get it?</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Check your spam or junk folder</li>
                <li>Wait a minute or two — emails can be slow</li>
                <li>Double-check the email address you entered</li>
              </ul>
            </div>
            <div className="pt-4">
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                ← Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 space-y-2">
              <h1 className="font-display text-3xl font-medium tracking-tight">
                Forgot your password?
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter the email you signed up with. We&apos;ll send you a link to set a new password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" autoFocus
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
                {submitting ? 'Sending…' : 'Send reset link'}
              </Button>

              <p className="pt-4 text-center text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  )
}
