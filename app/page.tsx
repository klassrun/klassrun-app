// app/page.tsx
//
// Editorial-style splash for app.klassrun.com.
//
// Design notes:
//   - Warm cream canvas (not stark white) — premium, calm
//   - Fraunces serif for the hero headline — characterful, distinct
//   - Editorial section markers (01, 02, 03) instead of generic cards
//   - Hand-drawn SVG arrow accent — adds warmth without being playful
//   - Staggered fade-up on load (one moment of motion, not many)
//   - Asymmetric grid that breaks out of the dashboard-template look

import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'

type MeResponse = {
  user: { role: string; school: { slug: string } | null }
}

export default async function HomePage() {
  const token = await getAuthCookie()
  if (token) {
    const result = await apiFetch<MeResponse>('/api/auth/me', { token })
    if (result.ok && result.data?.user) {
      redirect(result.data.user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 sm:px-10">
          <Link href="/" className="group inline-flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun"
              width={40} height={40}
              className="h-10 w-auto transition-transform group-hover:scale-105"
              unoptimized
            />
            <span className="font-display text-xl font-semibold tracking-tight">
              Klassrun
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="ml-1">
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative top-right arc */}
        <svg
          className="pointer-events-none absolute -right-40 -top-32 h-[520px] w-[520px] text-primary/10"
          viewBox="0 0 200 200" fill="none" aria-hidden="true"
        >
          <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 4" />
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 3" />
        </svg>

        <div className="relative mx-auto max-w-6xl px-6 pt-12 pb-24 sm:px-10 sm:pt-20 sm:pb-32">
          {/* Eyebrow */}
          <p
            className="animate-fade-up mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary"
            style={{ animationDelay: '0ms' }}
          >
            <span className="h-px w-8 bg-primary" />
            For Nigerian schools
          </p>

          {/* Headline */}
          <h1
            className="animate-fade-up font-display text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[1.02] tracking-tight"
            style={{ animationDelay: '80ms' }}
          >
            Run your school{' '}
            <span className="font-display-wonky italic text-primary">academics</span>
            <br />
            from one place.
          </h1>

          {/* Subhead */}
          <p
            className="animate-fade-up mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            style={{ animationDelay: '160ms' }}
          >
            AI-powered lesson notes, schemes of work, and WAEC/NECO-style exam
            preparation — built specifically for the Nigerian curriculum.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: '240ms' }}
          >
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link href="/signup">
                Set up your school
                <svg className="ml-1 h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </Button>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="hidden h-px w-8 bg-border sm:block" />
              <span>14-day free trial · no card needed</span>
            </div>
          </div>

          {/* Hand-drawn underline accent under "academics" */}
          <svg
            className="pointer-events-none mt-16 h-6 w-44 text-primary/60 sm:hidden"
            viewBox="0 0 200 24" fill="none" aria-hidden="true"
          >
            <path
              d="M5 16 Q 50 4, 100 14 T 195 12"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"
            />
          </svg>
        </div>
      </section>

      {/* ── What you get section ──────────────────────────────────── */}
      <section className="border-t bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
          <div className="mb-16 max-w-2xl">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              What you get
            </p>
            <h2 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
              Less paperwork.<br />
              <span className="text-muted-foreground">More teaching.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              number="01"
              title="AI lesson notes"
              body="Pick a class, subject, and topic. Get a curriculum-aligned lesson note in under 30 seconds — formatted, ready to use."
            />
            <Feature
              number="02"
              title="WAEC & NECO questions"
              body="Generate exam-style questions with mark schemes. Filter by topic, difficulty, and past-paper patterns."
            />
            <Feature
              number="03"
              title="Schemes of work"
              body="Termly schemes that map to your school's calendar and the NERDC curriculum — auto-generated, fully editable."
            />
            <Feature
              number="04"
              title="Teacher accounts"
              body="Invite your teachers with one click. They set their own passwords, you keep control of who has access."
            />
            <Feature
              number="05"
              title="Built for Nigeria"
              body="Naira pricing. Paystack billing. NERDC curriculum mapped end to end. Made by Nigerians who get it."
            />
            <Feature
              number="06"
              title="Your school's URL"
              body="A clean address like greenfield-academy.klassrun.com. Looks professional in the parent group chat."
            />
          </div>
        </div>
      </section>

      {/* ── Quote / pull-out ──────────────────────────────────────── */}
      <section className="border-t">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:px-10 sm:py-28">
          <svg
            className="mx-auto mb-8 h-10 w-10 text-primary/40"
            viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"
          >
            <path d="M9 8c-3 0-5 2-5 5v8h8v-8H7c0-2 1-3 3-3V8zm14 0c-3 0-5 2-5 5v8h8v-8h-5c0-2 1-3 3-3V8z" />
          </svg>
          <p className="font-display text-2xl leading-relaxed text-foreground sm:text-3xl">
            Lesson planning used to take my teachers
            <span className="font-display-wonky italic text-primary"> three hours every Sunday. </span>
            Now it takes thirty minutes — and the notes are better.
          </p>
          <p className="mt-8 text-sm text-muted-foreground">
            Mrs. A.O. — Principal · Lagos
          </p>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="border-t bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-24">
          <div className="grid gap-10 sm:grid-cols-[2fr_1fr] sm:items-end">
            <h2 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
              Set up your school in{' '}
              <span className="font-display-wonky italic text-primary">five minutes.</span>
            </h2>
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="h-12 w-full sm:w-auto">
                <Link href="/signup">Get started — it&apos;s free →</Link>
              </Button>
              <p className="text-xs text-background/60">
                No credit card. 14-day trial. Real support, by real Nigerians.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-10">
          <p>
            © {new Date().getFullYear()} Klassrun Technologies Ltd · RC 9463863
          </p>
          <p>
            Lagos, Nigeria · <a href="mailto:info@klassrun.com" className="hover:text-foreground transition-colors">info@klassrun.com</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

function Feature({
  number, title, body,
}: { number: string; title: string; body: string }) {
  return (
    <div className="group">
      <p className="editorial-number mb-4 text-5xl text-primary/30 transition-colors group-hover:text-primary/60">
        {number}
      </p>
      <h3 className="font-display text-xl font-medium leading-tight tracking-tight">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
