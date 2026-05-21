// app/dashboard/lessons/new/page.tsx
// batch-3-phase-1-lessons-new-page

import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'
import { NewLessonClient } from './new-lesson-client'

// batch-3-phase-1-5-force-dynamic
export const dynamic = 'force-dynamic'

type Assignment = {
  class: { id: string; name: string; level: string | null }
  subjects: Array<{ id: string; name: string; archivedAt: string | null; createdAt: string }>
}

export default async function NewLessonPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login?next=/dashboard/lessons/new')

  const result = await apiFetch<{
    assignments: Assignment[]
    totalSubjects: number
    totalClasses: number
  }>('/api/teachers/me/assignments', { token })

  if (!result.ok) {
    return (
      <div className="min-h-screen bg-paper text-foreground p-12">
        <p className="text-sm text-red-700">
          Could not load your assignments: {result.error?.message ?? 'Unknown error'}
        </p>
      </div>
    )
  }

  const assignments = result.data?.assignments ?? []
  return <NewLessonClient assignments={assignments} />
}
