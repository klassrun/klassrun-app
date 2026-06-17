'use client'
// app/portal/[slug]/login/login-client.tsx
// ops-5c-portal-login-client
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

export function PortalLoginClient({ slug }: { slug: string }) {
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!admissionNumber.trim() || !password) {
      setError('Enter your admission number and password')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, admissionNumber: admissionNumber.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error?.message ?? 'Could not sign in. Check your details and try again.')
        setSubmitting(false)
        return
      }
      window.location.href = `/portal/${slug}/dashboard`
    } catch {
      setError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Parent &amp; student portal</p>
        <h1 className="font-display text-3xl font-medium tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Use the admission number and password set up from your school invite.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="admissionNumber">Admission number</Label>
          <input
            id="admissionNumber"
            value={admissionNumber}
            onChange={(e) => setAdmissionNumber(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            placeholder="e.g. GRN/2024/015"
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full text-base">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
