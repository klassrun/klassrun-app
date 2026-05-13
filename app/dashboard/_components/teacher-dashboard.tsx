// app/dashboard/_components/teacher-dashboard.tsx
//
// Dashboard view for TEACHER users.
// Same shell as admin (top bar + sidebar + main) — different content.

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

export function TeacherDashboard({ me }: { me: Me }) {
  const schoolName = me.school?.name ?? 'Your school'
  const session    = me.school?.currentSession
  const status     = me.school?.status ?? 'PROVISIONING'

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun" width={32} height={32}
              className="h-8 w-auto" unoptimized
            />
            <span className="font-display text-base font-semibold tracking-tight">
              Klassrun
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {me.firstName} {me.lastName}
            </span>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-12 sm:px-8 lg:grid-cols-[260px_1fr] lg:py-16">
        <aside className="lg:sticky lg:top-12 lg:self-start">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            School
          </p>
          <h2 className="font-display text-2xl font-medium leading-tight tracking-tight">
            {schoolName}
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <Row
              label="Status"
              value={status === 'ACTIVE' ? 'Active' : 'Setting up'}
              tone={status === 'ACTIVE' ? 'good' : 'pending'}
            />
            {session && (
              <>
                <Row label="Session" value={session.name} />
                <Row label="Term" value={titleCase(session.currentTerm)} />
              </>
            )}
            <Row
              label="Portal"
              value={`${me.school?.slug ?? 'pending'}.klassrun.com`}
              mono
            />
          </div>

          <div className="mt-8 border-t pt-6">
            <p className="text-xs text-muted-foreground">
              Logged in as <span className="text-foreground">{me.email}</span>
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              Role · {me.role.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="animate-fade-up mb-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {greetingFor(new Date())}
            </p>
            <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
              Welcome back,{' '}
              <span className="font-display-wonky italic text-primary">{me.firstName}.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Your teaching dashboard. Once your school admin assigns you to
              classes, your tools fill in here.
            </p>
          </div>

          {/* Your classes — empty state */}
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Your classes
            </h2>
            <div className="rounded-xl border border-dashed bg-card/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Your school admin hasn&apos;t assigned you to any classes yet.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Once they do, your classes will appear here.
              </p>
            </div>
          </section>

          {/* Quick actions — stubs until Batch 3 */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Quick actions
            </h2>
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-start gap-4">
                <span className="editorial-number text-3xl text-primary/30">01</span>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-medium leading-tight tracking-tight">
                    Generate a lesson note
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Coming soon. Once classes are assigned, you&apos;ll generate
                    curriculum-aligned lesson notes here in seconds.
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Soon
                </span>
              </div>
            </div>
          </section>

          <p className="mt-12 max-w-xl text-xs text-muted-foreground">
            Questions? Reach us at{' '}
            <a href="mailto:info@klassrun.com" className="font-medium text-foreground hover:text-primary transition-colors">
              info@klassrun.com
            </a>
            .
          </p>
        </main>
      </div>
    </div>
  )
}

function Row({
  label, value, tone, mono,
}: {
  label: string
  value: string
  tone?: 'good' | 'pending'
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={[
          'text-right',
          mono ? 'font-mono text-[11px]' : 'font-medium',
          tone === 'good' && 'text-primary',
          tone === 'pending' && 'text-amber-600',
        ].filter(Boolean).join(' ')}
      >
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
