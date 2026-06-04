// app/dashboard/_components/teacher-dashboard.tsx
//
// Dashboard view for TEACHER users.
// Same shell as admin (top bar + sidebar + main) — different content.

// batch-2c-phase-4a-teacher-dashboard
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

type Assignment = {
  class: { id: string; name: string; level: string | null }
  subjects: Array<{
    id: string
    name: string
    archivedAt: string | null
    createdAt: string
  }>
}

export function TeacherDashboard({
  me,
  assignments,
  totalSubjects,
  totalClasses,
}: {
  me: Me
  assignments: Assignment[]
  totalSubjects: number
  totalClasses: number
}) {
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
          {/* batch-2b-logo-display */}
          {me.school?.logoUrl && (
            <img
              src={me.school.logoUrl.replace(
                '/upload/',
                '/upload/w_80,h_80,c_fill,q_auto,f_auto/',
              )}
              alt={`${schoolName} logo`}
              width={40}
              height={40}
              className="mb-3 h-10 w-10 rounded-lg object-cover"
            />
          )}
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

          {/* batch-2c-phase-4a-stats-row */}
          <section className="mb-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Subjects assigned" value={String(totalSubjects)} />
              <StatCard label="Classes" value={String(totalClasses)} />
              <StatCard label="Notes this week" value="—" muted />
            </div>
          </section>

          {/* batch-2c-phase-4a-assignments */}
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Your classes
            </h2>
            {assignments.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card/40 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t been assigned to any subjects yet.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask your school admin to assign you.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((a) => (
                  <div
                    key={a.class.id}
                    className="rounded-xl border bg-card p-6"
                  >
                    <div className="mb-4 flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-lg font-medium leading-tight tracking-tight">
                        {a.class.name}
                      </h3>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {levelLabel(a.class.level)}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {a.subjects.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center gap-3 text-sm"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                          <span>{s.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* batch-2c-phase-4a-coming-soon */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Coming soon
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link href="/dashboard/lessons/new" className="rounded-xl border bg-card p-6 hover:bg-muted/40 transition-colors">
              {/* batch-3-phase-1-lessons-cta */}
              <div className="flex items-start gap-4">
                <span className="editorial-number text-3xl text-primary">01</span>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-medium leading-tight tracking-tight">AI Lesson Notes</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Generate curriculum-aligned lesson notes for any class and topic, in seconds.</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">New</span>
              </div>
            </Link>
              {/* hotfix-batch-3-phase-2-teacher-schemes-card */}
              <Link href="/dashboard/schemes/new" className="rounded-xl border bg-card p-6 hover:bg-muted/40 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="editorial-number text-3xl text-primary">02</span>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-medium leading-tight tracking-tight">AI Schemes of Work</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Generate a 12-week scheme of work for any class and subject, ready to edit and share.</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">New</span>
                </div>
              </Link>
              {/* batch-3-phase-3a-teacher-exams-card */}
              <Link href="/dashboard/assessments/new" className="rounded-xl border bg-card p-6 hover:bg-muted/40 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="editorial-number text-3xl text-primary">03</span>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-medium leading-tight tracking-tight">AI Exam Questions</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Generate WAEC/NECO-style questions for any topic. Objective, theory, or essay.</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">New</span>
                </div>
              </Link>

          {/* batch-3-phase-3b-teacher-bank-link */}
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Your question bank
            </h2>
            <Link
              href="/dashboard/question-bank"
              className="flex items-center justify-between rounded-xl border bg-card px-6 py-4 hover:bg-muted/40 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">Browse question bank</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Every question your school has generated — growing each term.
                </p>
              </div>
              <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </section>
            </div>
          </section>

          {/* ops-1b-teacher-nav */}
          <section className="mt-10">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Results
            </h2>
            <Link href="/dashboard/results" className="flex items-center justify-between rounded-xl border bg-card px-6 py-4 hover:bg-muted/40 transition-colors">
              <div>
                <p className="text-sm font-medium">Record scores</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enter CA &amp; exam scores for your assigned subjects.</p>
              </div>
              <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </section>

          {/* hotfix-teacher-library-nav */}
          <section className="mt-10">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Your library
            </h2>
            <div className="space-y-3">
              <Link href="/dashboard/lessons" className="flex items-center justify-between rounded-xl border bg-card px-6 py-4 hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-medium">Lesson notes</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Everything you&apos;ve generated, ready to revisit or edit.</p>
                </div>
                <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/dashboard/schemes" className="flex items-center justify-between rounded-xl border bg-card px-6 py-4 hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-medium">Schemes of work</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your generated schemes, ready to revisit or edit.</p>
                </div>
                <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/dashboard/assessments" className="flex items-center justify-between rounded-xl border bg-card px-6 py-4 hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-medium">Exam questions</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Every set you&apos;ve generated, ready to revisit or export.</p>
                </div>
                <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
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

function StatCard({
  label, value, muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={[
          'mt-2 font-display text-3xl font-medium leading-none tracking-tight',
          muted ? 'text-muted-foreground' : 'text-foreground',
        ].filter(Boolean).join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

function ComingSoonCard({
  num, title, body,
}: {
  num: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card/40 p-6 opacity-70">
      <div className="flex items-start gap-4">
        <span className="editorial-number text-3xl text-primary/30">{num}</span>
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium leading-tight tracking-tight">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {body}
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Soon
        </span>
      </div>
    </div>
  )
}

function levelLabel(level: string | null): string {
  if (!level) return 'Not specified'
  const l = level.toLowerCase()
  if (l === 'junior') return 'Junior'
  if (l === 'senior') return 'Senior'
  return level
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
