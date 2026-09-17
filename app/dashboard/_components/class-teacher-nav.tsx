'use client'
// app/dashboard/_components/class-teacher-nav.tsx
// classteacher-app-v1
//
// "Your class" on the teacher dashboard. Renders NOTHING unless this teacher
// is the class teacher of at least one class, so a teacher who has not been
// assigned sees exactly the dashboard they see today.
//
// Reads /api/classes (already authenticate-only, no new endpoint) and keeps
// the rows whose classTeacherId is this user. The API is the real boundary —
// this only decides what to link to.

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ClassLite = {
  id: string
  name: string
  archivedAt: string | null
  classTeacherId?: string | null
}

export function ClassTeacherNav({ userId }: { userId: string }) {
  const [mine, setMine] = useState<ClassLite[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch('/api/classes', { cache: 'no-store' }).catch(() => null)
      if (!res || !res.ok || cancelled) return
      const data = await res.json().catch(() => null)
      const list: ClassLite[] = Array.isArray(data?.classes) ? data.classes : []
      if (cancelled) return
      setMine(list.filter((c) => !c.archivedAt && c.classTeacherId === userId))
    })()
    return () => { cancelled = true }
  }, [userId])

  if (mine.length === 0) return null

  const label = mine.map((c) => c.name).join(', ')

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Your class
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        You are the class teacher for {label}.
      </p>
      <div className="space-y-3">
        {/* my-class-v1 */}
        <NavCard
          href="/dashboard/my-class"
          title="My class"
          body="Your class list. Add a student, or fix a name or guardian detail yourself."
        />
        <NavCard
          href="/dashboard/attendance"
          title="Attendance"
          body="Record the termly attendance totals for your class — days opened, present, absent."
        />
        <NavCard
          href="/dashboard/behaviour"
          title="Behaviour"
          body="Rate each student on the behavioural traits for the term."
        />
      </div>
    </section>
  )
}

function NavCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border bg-card px-6 py-4 hover:bg-muted/40 transition-colors"
    >
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
      <svg className="h-4 w-4 flex-shrink-0 text-muted-foreground" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}
