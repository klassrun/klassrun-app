'use client'
// app/dashboard/_components/teacher-picker.tsx
// batch-2c-phase-3b-teacher-picker

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

export type TeacherSummary = {
  id: string
  firstName: string
  lastName: string
  email: string
  revokedAt: string | null
  inviteAccepted?: boolean
  status?: 'ACTIVE' | 'INVITED' | 'REVOKED'
}

export type SubjectForPicker = {
  id: string
  name: string
  teacherId: string | null
  teacher: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export function TeacherPickerDialog({
  subject,
  onClose,
  onSaved,
}: {
  subject: SubjectForPicker
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const [teachers, setTeachers] = useState<TeacherSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(subject.teacherId)
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/teachers', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setLoadError('Could not load teachers')
          return
        }
        const data = await res.json().catch(() => null)
        if (cancelled) return
        const list: TeacherSummary[] = Array.isArray(data?.teachers) ? data.teachers : []
        // Filter to active teachers only (revokedAt === null).
        // Pending invites (inviteAccepted=false) are intentionally included —
        // an admin scheduling ahead of term start should be able to assign
        // not-yet-onboarded teachers.
        const active = list.filter((t) => t.revokedAt === null)
        // Sort alphabetically by firstName, lastName
        active.sort((a, b) => {
          const an = `${a.firstName} ${a.lastName}`.toLowerCase()
          const bn = `${b.firstName} ${b.lastName}`.toLowerCase()
          return an.localeCompare(bn)
        })
        setTeachers(active)
      } catch {
        if (!cancelled) setLoadError('Could not load teachers')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!teachers) return []
    const q = query.trim().toLowerCase()
    if (!q) return teachers
    return teachers.filter((t) => {
      const fn = (t.firstName || '').toLowerCase()
      const ln = (t.lastName || '').toLowerCase()
      const em = (t.email || '').toLowerCase()
      return fn.includes(q) || ln.includes(q) || em.includes(q)
    })
  }, [teachers, query])

  async function submit(newTeacherId: string | null) {
    setSubmitting(true)
    setSaveError(null)
    const res = await fetch(`/api/subjects/${subject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: newTeacherId }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setSaveError(body?.error?.message || 'Could not update assignment')
      return
    }
    if (newTeacherId === null) {
      toast.success(`${subject.name} unassigned`)
    } else {
      const t = teachers?.find((x) => x.id === newTeacherId)
      const name = t ? `${t.firstName} ${t.lastName}` : 'teacher'
      toast.success(`${subject.name} assigned to ${name}`)
    }
    await onSaved()
  }

  function handleSave() {
    // No-op if nothing changed
    if (selectedId === subject.teacherId) {
      onClose()
      return
    }
    submit(selectedId)
  }

  function handleUnassign() {
    submit(null)
  }

  const currentName = subject.teacher
    ? `${subject.teacher.firstName} ${subject.teacher.lastName}`
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-medium leading-tight tracking-tight">
          {currentName ? 'Change teacher' : 'Assign teacher'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For <span className="font-medium text-foreground">{subject.name}</span>
        </p>

        {currentName && (
          <p className="mt-3 text-xs text-muted-foreground">
            Currently: <span className="font-medium text-foreground">{currentName}</span>
          </p>
        )}

        {/* Loading state */}
        {teachers === null && !loadError && (
          <p className="mt-6 text-sm text-muted-foreground">Loading teachers…</p>
        )}

        {/* Error state */}
        {loadError && (
          <p className="mt-6 text-sm text-red-600">{loadError}</p>
        )}

        {/* Empty state */}
        {teachers !== null && teachers.length === 0 && !loadError && (
          <div className="mt-6 rounded-md border bg-background px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No active teachers yet.</p>
            <Link
              href="/dashboard/teachers"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Invite teachers →
            </Link>
          </div>
        )}

        {/* List */}
        {teachers !== null && teachers.length > 0 && (
          <>
            <div className="mt-5">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teachers…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto rounded-md border bg-background">
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No teachers match &ldquo;{query}&rdquo;
                </p>
              )}
              {filtered.map((t) => {
                const isCurrent = t.id === subject.teacherId
                const isSelected = t.id === selectedId
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors ${
                      isSelected ? 'bg-muted/60' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="teacher-picker"
                      value={t.id}
                      checked={isSelected}
                      onChange={() => setSelectedId(t.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.firstName} {t.lastName}
                        {isCurrent && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (currently assigned)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </>
        )}

        {saveError && <p className="mt-3 text-xs text-red-600">{saveError}</p>}

        <div className="mt-6 flex items-center justify-between gap-2">
          <div>
            {subject.teacherId && (
              <button
                type="button"
                onClick={handleUnassign}
                disabled={submitting}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Unassign
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || teachers === null || teachers.length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
