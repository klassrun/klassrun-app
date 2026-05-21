// app/dashboard/classes/page.tsx
// Server component. SCHOOL_ADMIN only.
// batch-2c-phase-2-classes-page

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie'
import { ClassesClient } from './classes-client'

// batch-3-phase-1-5-force-dynamic
export const dynamic = 'force-dynamic'

const API_BASE = process.env.KLASSRUN_API_URL || 'https://klassrun-api.onrender.com'

type ClassItem = {
  id: string
  name: string
  level: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  _count: { subjects: number }
}

export default async function ClassesPage() {
  const store = await cookies()
  const token = store.get(AUTH_COOKIE_NAME)?.value
  if (!token) redirect('/login')

  // Verify role server-side as belt-and-braces (middleware already gates)
  const meRes = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null)

  if (!meRes || !meRes.ok) redirect('/login')
  const meData = await meRes.json().catch(() => null)
  const role = meData?.user?.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const listRes = await fetch(`${API_BASE}/api/classes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null)

  let initialClasses: ClassItem[] = []
  if (listRes && listRes.ok) {
    const data = await listRes.json().catch(() => null)
    initialClasses = data?.classes ?? []
  }

  return <ClassesClient initialClasses={initialClasses} />
}
