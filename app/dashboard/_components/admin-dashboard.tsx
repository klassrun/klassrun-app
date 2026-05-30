// app/dashboard/_components/admin-dashboard.tsx
//
// Dashboard view for SCHOOL_ADMIN users.
// Editorial layout matching the existing brand aesthetic.

import Image from 'next/image'
import Link from 'next/link'

type SchoolWithCounts = {
  id: string
  name: string
  slug: string
  status: string
  logoUrl: string | null
  state: string | null
  currentSession?: { name: string; currentTerm: string } | null
  sessions?: Array<{ name: string; currentTerm: string }>
  _count?: { users: number; lessonNotes?: number; assessments?: number }
}

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

export function AdminDashboard({
  me,
  school,
  teacherCount,
}: {
  me: Me
  school: SchoolWithCounts | null
  teacherCount: number
}) {
  const schoolName = me.school?.name ?? school?.name ?? 'Your school'
  const session    = me.school?.currentSession ?? school?.sessions?.[0] ?? null
  const status     = me.school?.status ?? school?.status ?? 'PROVISIONING'

  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* ── Top bar ───────────────────────────────────────────────── */}
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
        {/* ── Sidebar / school masthead ───────────────────────────── */}
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
            <StatusRow
              label="Status"
              value={status === 'ACTIVE' ? 'Active' : 'Setting up'}
              tone={status === 'ACTIVE' ? 'good' : 'pending'}
            />
            {session && (
              <>
                <StatusRow label="Session" value={session.name} />
                <StatusRow label="Term" value={titleCase(session.currentTerm)} />
              </>
            )}
            <StatusRow
              label="Portal"
              value={`${me.school?.slug ?? school?.slug ?? 'pending'}.klassrun.com`}
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

            {/* batch-2c-phase-4b-sidebar-ia */}
            <nav className="mt-4 space-y-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Academic
              </p>
              <div className="space-y-3 pl-1">
                {/* batch-2c-phase-1-academic-link */}
                <Link
                  href="/dashboard/academic"
                  className="flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
                >
                  Sessions & terms
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                {/* batch-2c-phase-2-classes-link */}
                <Link
                  href="/dashboard/classes"
                  className="flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
                >
                  Classes
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                {/* hotfix-batch-3-phase-2-admin-schemes-link */}
                <Link
                  href="/dashboard/schemes"
                  className="flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
                >
                  Schemes of work
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                {/* batch-3-phase-3a-admin-exams-link */}
                <Link
                  href="/dashboard/assessments"
                  className="flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
                >
                  Exam questions
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                {/* batch-3-phase-3b-admin-bank-link */}
                <Link
                  href="/dashboard/question-bank"
                  className="flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
                >
                  Question bank
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                {/* batch-2c-phase-4b-teachers-link */}
                <Link
                  href="/dashboard/teachers"
                  className="flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
                >
                  Teachers
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              <div className="border-t" />

              <Link
                href="/dashboard/settings"
                className="flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
              >
                Settings
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </nav>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────── */}
        <main className="min-w-0">
          {/* Editorial greeting */}
          <div className="animate-fade-up mb-12">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {greetingFor(new Date())}
            </p>
            <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
              Welcome back,{' '}
              <span className="font-display-wonky italic text-primary">{me.firstName}.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Three things to get your school running. Pick one to start.
            </p>
          </div>

          {/* Stats strip — one stat: teacher count */}
          <div className="mb-10 flex items-baseline gap-3">
            <span className="font-display text-4xl font-medium text-primary">
              {teacherCount}
            </span>
            <span className="text-sm text-muted-foreground">
              {teacherCount === 0
                ? 'teachers — invite your first below'
                : teacherCount === 1
                ? 'teacher on board'
                : 'teachers on board'}
            </span>
          </div>

          {/* Onboarding checklist */}
          <div className="space-y-px overflow-hidden rounded-xl border bg-card">
            <OnboardingStep
              number="01"
              title="Add your classes"
              body="Set up JSS 1, SS 2, and the rest. Klassrun uses these to scope lesson notes and exam questions to the right curriculum level."
              cta="Add classes"
              href="/dashboard/classes"
            />
            <OnboardingStep
              number="02"
              title="Invite your teachers"
              body="Send each teacher a one-time invite link. They set their own password — you keep control of who has access."
              cta="Invite teachers"
              href="/dashboard/teachers"
            />
            {/* batch-2c-phase-4b-step-three-dormant */}
            {/* batch-3-phase-1-step-three-active */}
            <OnboardingStep
              number="03"
              title="Generate your first lesson note"
              body="Pick a class, subject, and topic. We do the rest — formatted, curriculum-aligned, ready in seconds."
              cta="Invite teachers to start generating"
              href="#"
              accent
              disabled
            />
          </div>

          <p className="mt-12 max-w-xl text-xs text-muted-foreground">
            Need help getting started? Reach us at{' '}
            <a href="mailto:info@klassrun.com" className="font-medium text-foreground hover:text-primary transition-colors">
              info@klassrun.com
            </a>
            {' '}— we&apos;re Nigerian, we&apos;re fast, and we actually care.
          </p>
        </main>
      </div>
    </div>
  )
}

function StatusRow({
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

function OnboardingStep({
  // batch-2c-phase-4b-onboarding-step-disabled
  number, title, body, cta, href, accent, disabled,
}: {
  number: string
  title: string
  body: string
  cta: string
  href: string
  accent?: boolean
  disabled?: boolean
}) {
  const baseClasses = [
    'group flex flex-col gap-4 px-6 py-6 transition-colors sm:flex-row sm:items-center sm:gap-8 sm:px-8 sm:py-7',
    disabled ? 'cursor-default opacity-70' : 'hover:bg-muted/40',
    accent ? 'bg-accent/30' : 'bg-card',
  ].join(' ')

  const content = (
    <>
      <p className={[
        'editorial-number text-4xl text-primary/40 transition-colors sm:text-5xl',
        disabled ? '' : 'group-hover:text-primary',
      ].join(' ')}>
        {number}
      </p>
      <div className="flex-1">
        <h3 className="font-display text-xl font-medium leading-tight tracking-tight">
          {title}
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      <div className={[
        'flex items-center gap-2 text-sm font-medium transition-colors sm:flex-shrink-0',
        disabled
          ? 'text-muted-foreground'
          : 'text-foreground group-hover:text-primary',
      ].join(' ')}>
        {cta}
        {!disabled && (
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </>
  )

  if (disabled) {
    return <div className={baseClasses} aria-disabled="true">{content}</div>
  }
  return <Link href={href} className={baseClasses}>{content}</Link>
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
