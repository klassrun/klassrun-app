// app/dashboard/classes/[id]/page.tsx
// batch-2c-phase-3a-class-detail-page
// batch-2c-phase-3a-class-detail-page-hotfix

import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { ClassDetailClient } from './class-detail-client'

// batch-3-phase-1-5-force-dynamic
export const dynamic = 'force-dynamic'

type ClassItem = {
  id: string
  name: string
  level: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  _count: { subjects: number }
}

// batch-2c-phase-3b-page-hotfix
type Subject = {
  id: string
  name: string
  teacherId: string | null
  teacher: { id: string; firstName: string; lastName: string; email: string } | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

type MeResponse = {
  user: {
    id: string
    role: string
    schoolId: string | null
  }
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')

  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const { id } = await params

  const [classResult, subjectsResult] = await Promise.all([
    apiFetch<{ class: ClassItem }>(`/api/classes/${id}`, { token }),
    apiFetch<{ subjects: Subject[] }>(`/api/classes/${id}/subjects`, { token }),
  ])

  if (!classResult.ok || !classResult.data?.class) {
    redirect('/dashboard/classes')
  }

  const cls = classResult.data.class
  const subjects = subjectsResult.ok ? (subjectsResult.data?.subjects ?? []) : []

  return <ClassDetailClient initialClass={cls} initialSubjects={subjects} />
}
