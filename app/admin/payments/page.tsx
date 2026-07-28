// app/admin/payments/page.tsx
// b2b-payments-v1 - Payments ledger (SUPER_ADMIN only). Mirrors
// app/admin/schools/page.tsx exactly: force-dynamic, getAuthCookie -> /login,
// /api/auth/me -> SUPER_ADMIN or /dashboard, same masthead.

import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { PaymentsTable, type AdminPayment } from './_components/payments-table'

export const dynamic = 'force-dynamic'

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
type PaymentsResponse = { payments: AdminPayment[] }

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string; limit?: string }>
}) {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const me = await apiFetch<MeResponse>('/api/auth/me', { token })
  const user = me.data?.user
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  // Next 16: searchParams is a Promise on both pages and handlers.
  const sp = await searchParams
  const schoolId = typeof sp.schoolId === 'string' ? sp.schoolId.trim() : ''
  const rawLimit = Number(sp.limit)
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 500) : 0

  const qs = new URLSearchParams()
  if (schoolId) qs.set('schoolId', schoolId)
  if (limit) qs.set('limit', String(limit))
  const suffix = qs.toString() ? '?' + qs.toString() : ''

  const result = await apiFetch<PaymentsResponse>('/api/admin/payments' + suffix, { token })
  const payments = result.data?.payments ?? []
  const loadError = result.ok ? null : (result.error?.message ?? 'Could not load payments')

  return (
    <div className="min-h-screen bg-foreground text-background">
      <header className="border-b border-background/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/admin" className="inline-flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Klassrun" width={32} height={32}
              className="h-8 w-auto" unoptimized
            />
            <span className="font-display text-base font-semibold tracking-tight">Klassrun</span>
            <span className="ml-2 hidden h-4 w-px bg-background/20 sm:inline-block" />
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-background/60 sm:inline">
              Platform Console
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/schools"
              className="rounded-lg border border-background/20 px-3 py-1.5 text-xs font-medium hover:bg-background/10 transition-colors"
            >
              Schools
            </Link>
            <Link
              href="/admin"
              className="rounded-lg border border-background/20 px-3 py-1.5 text-xs font-medium hover:bg-background/10 transition-colors"
            >
              Console
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">Super Admin</p>
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Payments</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-background/70">
          The full billing ledger, newest first. Every activation books a row here -
          whether it came from the Paystack webhook, the verify fallback, or a manual
          extension from the schools table.
        </p>

        {schoolId ? (
          <p className="mt-4 text-xs text-background/60">
            Filtered to one school.{' '}
            <Link href="/admin/payments" className="underline underline-offset-2 hover:text-background">
              Show all payments
            </Link>
          </p>
        ) : null}

        {loadError ? (
          <p className="mt-8 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {loadError}
          </p>
        ) : null}

        <div className="mt-10">
          <PaymentsTable payments={payments} filtered={Boolean(schoolId)} />
        </div>
      </section>
    </div>
  )
}
