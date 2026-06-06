// app/dashboard/_components/bursar-dashboard.tsx
// ops-4c-bursar-landing
//
// Landing view for BURSAR users. Deliberately minimal: school masthead +
// a single Fees entry point. No admin nav — a bursar's only surface is fees.
// Uses `me` only (no extra API fetch); proxy.ts enforces the real gating.

import Image from 'next/image'
import Link from 'next/link'

type Me = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  school: {
    id: string
    name: string
    slug: string
    status: string
    logoUrl: string | null
    portalUrl: string
    currentSession: { name: string; currentTerm: string } | null
  } | null
}

export function BursarDashboard({ me }: { me: Me }) {
  const schoolName = me.school?.name ?? 'Your school'
  const session    = me.school?.currentSession ?? null
  const status     = me.school?.status ?? 'PROVISIONING'

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-3">
            <Image src="/images/logo.webp" alt="Klassrun" width={32} height={32} className="h-8 w-auto" unoptimized />
            <span className="font-display text-base font-semibold tracking-tight">Klassrun</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground sm:inline">{me.firstName} {me.lastName}</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-12 sm:px-8 lg:grid-cols-[260px_1fr] lg:py-16">
        <aside className="lg:sticky lg:top-12 lg:self-start">
          {me.school?.logoUrl && (
            <img
              src={me.school.logoUrl.replace('/upload/', '/upload/w_80,h_80,c_fill,q_auto,f_auto/')}
              alt={`${schoolName} logo`} width={40} height={40}
              className="mb-3 h-10 w-10 rounded-lg object-cover"
            />
          )}
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">School</p>
          <h2 className="font-display text-2xl font-medium leading-tight tracking-tight">{schoolName}</h2>

          <div className="mt-5 space-y-3 text-sm">
            <Row label="Status" value={status === 'ACTIVE' ? 'Active' : 'Setting up'} tone={status === 'ACTIVE' ? 'good' : 'pending'} />
            {session && (
              <>
                <Row label="Session" value={session.name} />
                <Row label="Term" value={titleCase(session.currentTerm)} />
              </>
            )}
          </div>

          <div className="mt-8 border-t pt-6">
            <p className="text-xs text-muted-foreground">Logged in as <span className="text-foreground">{me.email}</span></p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">Role · bursar</p>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="animate-fade-up mb-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">{greetingFor(new Date())}</p>
            <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
              Welcome back,{' '}
              <span className="font-display-wonky italic text-primary">{me.firstName}.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Your fees workspace. Track who has paid, mark payments, and see per-class collection at a glance.
            </p>
          </div>

          <Link
            href="/dashboard/fees"
            className="group flex items-center justify-between rounded-xl border bg-card px-6 py-6 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-start gap-5">
              <span className="editorial-number text-4xl text-primary/40 transition-colors group-hover:text-primary sm:text-5xl">01</span>
              <div>
                <h3 className="font-display text-xl font-medium leading-tight tracking-tight">Fees</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Pick a class, session, and term to load the roster, mark students paid or unpaid, and view collection stats.
                </p>
              </div>
            </div>
            <svg className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <p className="mt-12 max-w-xl text-xs text-muted-foreground">
            Need help? Reach us at{' '}
            <a href="mailto:info@klassrun.com" className="font-medium text-foreground hover:text-primary transition-colors">info@klassrun.com</a>.
          </p>
        </main>
      </div>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'pending' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={['text-right font-medium', tone === 'good' && 'text-primary', tone === 'pending' && 'text-amber-600'].filter(Boolean).join(' ')}>
        {value}
      </span>
    </div>
  )
}

function greetingFor(now: Date): string {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}
