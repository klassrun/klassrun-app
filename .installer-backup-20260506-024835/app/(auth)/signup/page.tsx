'use client'

// app/(auth)/signup/page.tsx
//
// School signup. Three-pane form on desktop, single-column on mobile.
// Submits to /api/auth/signup which sets the auth cookie and returns
// the school context. We then do a HARD redirect (not router.push) so
// the browser re-requests with the new cookie attached.

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SlugStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'unavailable'; error: string }

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

export default function SignupPage() {
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [schoolState, setSchoolState] = useState('Lagos')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ kind: 'idle' })
  const [suggestions, setSuggestions] = useState<string[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Auto-suggest slug from school name (until user manually edits)
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (slugManuallyEdited || !schoolName.trim()) return

    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
    slugDebounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ name: schoolName, limit: '4' })
        if (schoolState) params.set('state', schoolState)
        const res  = await fetch(`/api/slug/suggest?${params}`)
        const data = await res.json()
        if (Array.isArray(data.suggestions) && data.suggestions.length) {
          setSlug(data.suggestions[0])
          setSuggestions(data.suggestions)
        }
      } catch {
        /* network errors during typing — silent */
      }
    }, 400)

    return () => {
      if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
    }
  }, [schoolName, schoolState, slugManuallyEdited])

  // Check slug availability whenever it changes
  const checkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!slug) {
      setSlugStatus({ kind: 'idle' })
      return
    }
    setSlugStatus({ kind: 'checking' })

    if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current)
    checkDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug/check?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        if (data.available) {
          setSlugStatus({ kind: 'available' })
        } else {
          setSlugStatus({
            kind: 'unavailable',
            error: data.error || 'Not available',
          })
        }
      } catch {
        setSlugStatus({ kind: 'unavailable', error: 'Could not verify — try again' })
      }
    }, 350)

    return () => {
      if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current)
    }
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (slugStatus.kind === 'unavailable') {
      setSubmitError(`Slug issue: ${slugStatus.error}`)
      return
    }
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, firstName, lastName,
          schoolName, schoolAddress, schoolState,
          slug: slug || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data?.error?.message || 'Signup failed. Please try again.')
        setSubmitting(false)
        return
      }
      // HARD redirect — not router.push — so the new cookie attaches to the
      // next request and middleware/server components see it.
      window.location.href = '/dashboard'
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
        {/* ── Left rail: brand + reassurance ── */}
        <aside className="relative hidden flex-col justify-between bg-[oklch(0.97_0.01_145)] p-12 lg:flex">
          <div>
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
          </div>

          <div className="space-y-8">
            <p className="font-heading text-3xl leading-snug tracking-tight text-foreground">
              Run your school&apos;s academics from one place.
            </p>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <Bullet>Curriculum-aligned lesson notes in seconds</Bullet>
              <Bullet>WAEC &amp; NECO-style exam preparation</Bullet>
              <Bullet>Schemes of work for every term</Bullet>
              <Bullet>14-day free trial — no card required</Bullet>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Klassrun Technologies Ltd · RC 9463863
          </p>
        </aside>

        {/* ── Right pane: form ── */}
        <main className="flex flex-col px-6 py-12 sm:px-12 lg:px-16 lg:py-16">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun" width={40} height={40}
              className="h-10 w-auto" unoptimized
            />
            <span className="font-heading text-lg font-semibold">Klassrun</span>
          </div>

          <div className="mb-8 space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Set up your school
            </h1>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal info */}
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your details
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First name" id="firstName" required>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" />
                </Field>
                <Field label="Last name" id="lastName" required>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
                </Field>
              </div>
              <Field label="Work email" id="email" required>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </Field>
              <Field label="Password" id="password" required hint="At least 8 characters">
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
              </Field>
            </section>

            {/* School info */}
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your school
              </h2>
              <Field label="School name" id="schoolName" required>
                <Input
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  placeholder="e.g. Greenfield Academy"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
                <Field label="State" id="schoolState">
                  <select
                    id="schoolState"
                    value={schoolState}
                    onChange={(e) => setSchoolState(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Address (optional)" id="schoolAddress">
                  <Input id="schoolAddress" value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} />
                </Field>
              </div>
            </section>

            {/* Slug picker */}
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your school&apos;s URL
              </h2>

              <div className="rounded-lg border bg-muted/30 p-4">
                <Label htmlFor="slug" className="mb-2">
                  Choose your portal address
                </Label>

                <div className="flex flex-wrap items-stretch gap-0 overflow-hidden rounded-lg border bg-background">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase())
                      setSlugManuallyEdited(true)
                    }}
                    placeholder="your-school"
                    className="flex-1 rounded-none border-0 shadow-none focus-visible:ring-0"
                    aria-invalid={slugStatus.kind === 'unavailable'}
                  />
                  <span className="flex items-center bg-muted px-3 text-sm font-mono text-muted-foreground">
                    .klassrun.com
                  </span>
                </div>

                <div className="mt-2 min-h-[1.25rem] text-xs">
                  {slugStatus.kind === 'checking' && (
                    <span className="text-muted-foreground">Checking availability…</span>
                  )}
                  {slugStatus.kind === 'available' && (
                    <span className="text-primary">✓ Available</span>
                  )}
                  {slugStatus.kind === 'unavailable' && (
                    <span className="text-destructive">{slugStatus.error}</span>
                  )}
                </div>

                {suggestions.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center">Try:</span>
                    {suggestions.slice(0, 4).map((s) =>
                      s !== slug ? (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSlug(s)
                            setSlugManuallyEdited(true)
                          }}
                          className="rounded-full border bg-background px-3 py-1 text-xs font-mono hover:border-primary hover:text-primary transition-colors"
                        >
                          {s}
                        </button>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Submit */}
            {submitError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                size="lg"
                disabled={submitting || slugStatus.kind === 'unavailable'}
                className="w-full h-11 text-base"
              >
                {submitting ? 'Setting up your school…' : 'Create your school'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By creating an account you agree to Klassrun&apos;s Terms of Service and Privacy Policy.
              </p>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}

function Field({
  label, id, required, hint, children,
}: {
  label: string
  id: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <svg
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
        viewBox="0 0 20 20" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M16.667 5l-8.75 8.75L3.333 9.167" />
      </svg>
      <span className="leading-relaxed">{children}</span>
    </li>
  )
}
