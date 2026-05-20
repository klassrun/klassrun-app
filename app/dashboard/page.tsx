// app/dashboard/page.tsx
//
// Authenticated dashboard. Routes by role:
//   SUPER_ADMIN → redirected to /admin (handled here as belt-and-suspenders;
//     middleware also enforces this).
//   TEACHER     → <TeacherDashboard />
//   SCHOOL_ADMIN (and any fallthrough) → <AdminDashboard />

import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { AdminDashboard } from './_components/admin-dashboard'
import { TeacherDashboard } from './_components/teacher-dashboard'

type MeResponse = {
  user: {
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
}

type SchoolMeResponse = {
  school: {
    id: string
    name: string
    slug: string
    status: string
    state: string | null
    logoUrl: string | null
    _count?: { users: number; lessonNotes?: number; assessments?: number }
    sessions?: Array<{ name: string; currentTerm: string }>
  } | null
  teacherCount: number
}

async function getCurrentUser(token: string): Promise<MeResponse['user'] | null> {
  const result = await apiFetch<MeResponse>('/api/auth/me', { token })
  return result.data?.user ?? null
}

async function getSchool(token: string): Promise<SchoolMeResponse | null> {
  const result = await apiFetch<SchoolMeResponse>('/api/schools/me', { token })
  return result.data ?? null
}

export default async function DashboardPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const user = await getCurrentUser(token)
  if (!user) redirect('/login')
  if (user.role === 'SUPER_ADMIN') redirect('/admin')

  // For SCHOOL_ADMIN we need teacherCount + school details.
  // For TEACHER we don't strictly need it, but the call is cheap and the
  // teacher dashboard may use it for the sidebar. Fetch once, pass through.
  const schoolData = await getSchool(token)

  if (user.role === 'TEACHER') {
    // batch-2c-phase-4a-teacher-dashboard-fetch
    const assignmentsResult = await apiFetch<{
      assignments: Array<{
        class: { id: string; name: string; level: string | null }
        subjects: Array<{
          id: string
          name: string
          archivedAt: string | null
          createdAt: string
        }>
      }>
      totalSubjects: number
      totalClasses: number
    }>('/api/teachers/me/assignments', { token })

    return (
      <TeacherDashboard
        me={user}
        assignments={assignmentsResult.data?.assignments ?? []}
        totalSubjects={assignmentsResult.data?.totalSubjects ?? 0}
        totalClasses={assignmentsResult.data?.totalClasses ?? 0}
      />
    )
  }

  // SCHOOL_ADMIN (and fallthrough)
  return (
    <AdminDashboard
      me={user}
      school={schoolData?.school ?? null}
      teacherCount={schoolData?.teacherCount ?? 0}
    />
  )
}
