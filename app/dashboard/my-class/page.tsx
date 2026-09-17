// app/dashboard/my-class/page.tsx
// my-class-v1
//
// A class teacher's own roster. The class is NOT a free choice — it comes from
// Class.classTeacherId, so a teacher sees their own class or classes and
// nothing else. The API enforces the same rule; this only reflects it.

import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { MyClassClient } from './my-class-client'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string; schoolId: string | null } }
type ClassItem = { id: string; name: string; archivedAt: string | null; classTeacherId?: string | null }

export default async function MyClassPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')
  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')

  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  // An admin already has the richer Students page; don't give them a worse one.
  if (role === 'SCHOOL_ADMIN') redirect('/dashboard/students')
  if (role !== 'TEACHER') redirect('/dashboard')

  // Hoisted out of the callback on purpose: TypeScript narrows meResult.data
  // after the guards above but discards that narrowing inside a closure.
  const myUserId = meResult.data.user.id

  const classesResult = await apiFetch<{ classes: ClassItem[] }>('/api/classes', { token })
  const mine = (classesResult.ok ? (classesResult.data?.classes ?? []) : [])
    .filter((c) => !c.archivedAt && c.classTeacherId === myUserId)

  // A teacher who is nobody's class teacher has nothing to do here.
  if (mine.length === 0) redirect('/dashboard')

  return <MyClassClient classes={mine.map((c) => ({ id: c.id, name: c.name }))} />
}
