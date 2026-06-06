// app/dashboard/teachers/page.tsx
//
// School admin teacher management page. Shows list of teachers with their
// status (Active / Invited / Revoked) and provides actions:
//   - Invite a new teacher (form at top)
//   - Revoke a teacher (action menu)
//   - Reinstate a revoked teacher
//   - Reset a teacher's password (re-invite)
//
// Server component fetches the list on first render. Actions trigger
// the proxy route handlers which call the API and refresh the list.

import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { TeachersClient } from './teachers-client'

// batch-3-phase-1-5-force-dynamic
export const dynamic = 'force-dynamic'

type MeResponse = {
  user: {
    id: string
    role: string
    firstName: string
    school: { name: string; slug: string } | null
  }
}

type TeachersResponse = {
  teachers: Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    inviteAccepted: boolean
    revokedAt: string | null
    createdAt: string
    status: 'ACTIVE' | 'INVITED' | 'REVOKED'
    role: string // ops-4c-role-passthrough
  }>
}

async function fetchData() {
  const token = await getAuthCookie()
  if (!token) return null

  const [meResult, teachersResult] = await Promise.all([
    apiFetch<MeResponse>('/api/auth/me', { token }),
    apiFetch<TeachersResponse>('/api/teachers', { token }),
  ])

  return {
    me: meResult.data?.user ?? null,
    teachers: teachersResult.data?.teachers ?? [],
  }
}

export default async function TeachersPage() {
  const data = await fetchData()

  if (!data || !data.me) redirect('/login')
  const { me, teachers } = data

  if (me.role === 'SUPER_ADMIN') redirect('/admin')
  if (me.role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Dashboard
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:py-16">
        <div className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {me.school?.name ?? 'Your school'}
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight">
            Teachers
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground leading-relaxed">
            Invite teachers to access Klassrun for your school. They&apos;ll receive an email link to set their own password.
          </p>
        </div>

        <TeachersClient initialTeachers={teachers} />
      </main>
    </div>
  )
}
