// app/admin/page.tsx
//
// Platform-wide super admin console. Dark masthead signals "operator mode"
// — same Klassrun visual language but with elevated authority.

import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'

type MeResponse = {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    school: null
  }
}

async function getCurrentUser() {
  const token = await getAuthCookie()
  if (!token) return null
  const result = await apiFetch<MeResponse>('/api/auth/me', { token })
  return result.data?.user ?? null
}

// superadmin-mvp-console — platform metrics for the console band
type AdminMetrics = {
  schools: { total: number; provisioning: number; active: number; suspended: number; expired: number }
  subscriptions: { trial: number; active: number; pastDue: number; cancelled: number; expired: number }
  content: { notes: number; schemes: number; exams: number }
  teachers: number
}

async function getMetrics(): Promise<AdminMetrics | null> {
  const token = await getAuthCookie()
  if (!token) return null
  const result = await apiFetch<AdminMetrics>('/api/admin/metrics', { token })
  return result.data ?? null
}

function MetricTile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-foreground p-5 sm:p-6">
      <p className="editorial-number text-3xl text-primary sm:text-4xl">{value.toLocaleString()}</p>
      <p className="mt-2 text-sm font-medium text-background">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-background/50">{hint}</p> : null}
    </div>
  )
}

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const metrics = await getMetrics()

  return (
    <div className="min-h-screen bg-foreground text-background">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="border-b border-background/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/admin" className="inline-flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun" width={32} height={32}
              className="h-8 w-auto" unoptimized
            />
            <span className="font-display text-base font-semibold tracking-tight">
              Klassrun
            </span>
            <span className="ml-2 hidden h-4 w-px bg-background/20 sm:inline-block" />
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-background/60 sm:inline">
              Platform Console
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-background/60 sm:inline">
              {user.email}
            </span>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-background/20 bg-transparent px-3 py-1.5 text-xs font-medium hover:bg-background/10 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-background/10">
        {/* Subtle decorative grid */}
        <svg
          className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px] text-primary/10"
          viewBox="0 0 200 200" fill="none" aria-hidden="true"
        >
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="200" height="200" fill="url(#grid)" />
        </svg>

        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20">
          <p className="animate-fade-up mb-4 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Super Admin
          </p>
          <h1
            className="animate-fade-up font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl"
            style={{ animationDelay: '80ms' }}
          >
            Welcome back,{' '}
            <span className="font-display-wonky italic text-primary">{user.firstName}.</span>
          </h1>
          <p
            className="animate-fade-up mt-5 max-w-xl text-base leading-relaxed text-background/70"
            style={{ animationDelay: '160ms' }}
          >
            Platform-wide controls. Manage schools, monitor signups, review audit
            logs, and keep Klassrun running smoothly.
          </p>
        </div>
      </section>

      {/* superadmin-mvp — platform metrics band */}
      <section id="platform-metrics" className="border-b border-background/10">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-14">
          <p className="mb-8 text-xs font-medium uppercase tracking-[0.18em] text-background/50">
            Platform at a glance
          </p>
          {metrics ? (
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-background/15 bg-background/5 sm:grid-cols-4">
              <MetricTile label="Schools" value={metrics.schools.total} hint={`${metrics.schools.active} active`} />
              <MetricTile label="On trial" value={metrics.subscriptions.trial} hint={`${metrics.subscriptions.active} paid`} />
              <MetricTile label="Suspended" value={metrics.schools.suspended} hint={`${metrics.schools.provisioning} setting up`} />
              <MetricTile label="Teachers" value={metrics.teachers} hint="all schools" />
              <MetricTile label="Lesson notes" value={metrics.content.notes} />
              <MetricTile label="Schemes" value={metrics.content.schemes} />
              <MetricTile label="Exams" value={metrics.content.exams} />
              <MetricTile label="Paid plans" value={metrics.subscriptions.active} hint="active subs" />
            </div>
          ) : (
            <p className="text-sm text-background/50">Metrics unavailable right now.</p>
          )}
        </div>
      </section>
      {/* ── Tools grid ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-background/50">
          Tools
        </p>
        <h2 className="font-display text-2xl font-medium tracking-tight">
          What would you like to do?
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-background/15 bg-background/5 sm:grid-cols-2 lg:grid-cols-3">
          <AdminCard
            number="01"
            title="All schools"
            description="View, suspend, or verify schools across the platform."
            href="/admin/schools"
          />
          <AdminCard
            number="02"
            title="Recent signups"
            description="See which schools joined this week and their trial status."
            href="/admin/signups"
            comingSoon
          />
          <AdminCard
            number="03"
            title="Audit log"
            description="Every authentication event: signups, logins, invites, failures."
            href="/admin/audit"
            comingSoon
          />
          <AdminCard
            number="04"
            title="Platform metrics"
            description="Active schools, lesson notes generated, exam questions delivered."
            href="#platform-metrics"
          />
          <AdminCard
            number="05"
            title="Reserved slugs"
            description="Manage subdomain names blocked from school signup."
            href="/admin/reserved-slugs"
            comingSoon
          />
          <AdminCard
            number="06"
            title="Super admins"
            description="Add or remove other super admin accounts."
            href="/admin/team"
            comingSoon
          />
        </div>

        {/* Footer note */}
        <p className="mt-12 max-w-xl text-xs text-background/50">
          Authenticated as{' '}
          <span className="font-mono text-background/80">{user.email}</span>
          {' '}· role{' '}
          <span className="font-mono text-background/80">{user.role}</span>
        </p>
      </section>
    </div>
  )
}

function AdminCard({
  number, title, description, href, comingSoon,
}: {
  number: string
  title: string
  description: string
  href: string
  comingSoon?: boolean
}) {
  const inner = (
    <div className="group h-full bg-foreground p-6 transition-colors hover:bg-background/5 sm:p-7">
      <div className="flex items-start justify-between gap-2">
        <p className="editorial-number text-3xl text-primary/40 transition-colors group-hover:text-primary sm:text-4xl">
          {number}
        </p>
        {comingSoon && (
          <span className="rounded-full border border-background/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-background/50">
            Soon
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-background">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-background/60">
        {description}
      </p>
    </div>
  )

  if (comingSoon) {
    return <div className="cursor-not-allowed">{inner}</div>
  }
  return <Link href={href}>{inner}</Link>
}
