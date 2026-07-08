// app/admin/schools/page.tsx
// superadmin-mvp — All schools (SUPER_ADMIN only). Server-fetches the list via
// apiFetch (same pattern as dashboard/page.tsx); the table below mutates.

import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { SchoolsTable, type AdminSchool } from './_components/schools-table'

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
type SchoolsResponse = { schools: AdminSchool[] }

export default async function AdminSchoolsPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const me = await apiFetch<MeResponse>('/api/auth/me', { token })
  const user = me.data?.user
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const result = await apiFetch<SchoolsResponse>('/api/admin/schools', { token })
  const schools = result.data?.schools ?? []

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
          <Link
            href="/admin"
            className="rounded-lg border border-background/20 px-3 py-1.5 text-xs font-medium hover:bg-background/10 transition-colors"
          >
            ← Console
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">Super Admin</p>
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">All schools</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-background/70">
          Every school on the platform, newest first. Approve a school to mark it active, or
          suspend one to lock its users out on their next request.
        </p>

        <div className="mt-10">
          <SchoolsTable schools={schools} />
        </div>
      </section>
    </div>
  )
}
