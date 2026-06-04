// app/dashboard/students/page.tsx
// ops-1b-students-page
import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { StudentsClient } from './students-client'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string; schoolId: string | null } }
type ClassItem = { id: string; name: string; level: string | null; archivedAt: string | null }
type Student = {
  id: string
  admissionNumber: string
  firstName: string
  lastName: string
  middleName: string | null
  photoUrl: string | null
  gender: string | null
  dateOfBirth: string | null
  guardianName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  classId: string
  archivedAt: string | null
  class?: { id: string; name: string } | null
}

export default async function StudentsPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')
  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const [classesResult, studentsResult] = await Promise.all([
    apiFetch<{ classes: ClassItem[] }>('/api/classes', { token }),
    apiFetch<{ students: Student[] }>('/api/students', { token }),
  ])

  const classes = classesResult.ok ? (classesResult.data?.classes ?? []) : []
  const students = studentsResult.ok ? (studentsResult.data?.students ?? []) : []

  return <StudentsClient initialClasses={classes} initialStudents={students} />
}
