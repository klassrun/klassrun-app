'use client'
// app/portal/[slug]/accept/[token]/accept-client.tsx
// ops-5c-portal-accept-client
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

export function PortalAcceptClient({ slug, token }: { slug: string; token: string }) {
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPw) { setError('Passwords do not match'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/portal/accept/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error?.message ?? 'Could not set up access. The link may be expired.')
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
        <h1 className="font-display text-3xl font-medium tracking-tight">Set up your access</h1>
        <p className="text-sm text-muted-foreground">Choose a password to view results, report cards and fees.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" autoFocus />
          <p className="text-xs text-muted-foreground">At least 8 characters</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPw">Confirm password</Label>
          <PasswordInput id="confirmPw" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={8} autoComplete="new-password" />
        </div>
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
        )}
        <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full text-base">
          {submitting ? 'Setting up…' : 'Set up access'}
        </Button>
      </form>
    </div>
  )
}
