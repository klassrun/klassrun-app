'use client'
// app/dashboard/classes/[id]/class-detail-client.tsx
// batch-2c-phase-3a-class-detail-client
// batch-2c-phase-3b-teacher-display

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  TeacherPickerDialog,
  type SubjectForPicker,
} from '@/app/dashboard/_components/teacher-picker'

type ClassItem = {
  id: string
  name: string
  level: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  _count: { subjects: number }
}

type SubjectTeacher = {
  id: string
  firstName: string
  lastName: string
  email: string
}

type Subject = {
  id: string
  name: string
  teacherId: string | null
  teacher: SubjectTeacher | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

const LEVEL_LABEL: Record<string, string> = {
  junior: 'Junior secondary',
  senior: 'Senior secondary',
}

export function ClassDetailClient({
  initialClass,
  initialSubjects,
}: {
  initialClass: ClassItem
  initialSubjects: Subject[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [cls] = useState<ClassItem>(initialClass)
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [archiving, setArchiving] = useState<Subject | null>(null)
  const [pickingTeacherFor, setPickingTeacherFor] = useState<Subject | null>(null)
  const [loadingArchived, setLoadingArchived] = useState(false)

  async function reload(includeArchived: boolean) {
    const qs = includeArchived ? '?includeArchived=true' : ''
    const res = await fetch(`/api/classes/${cls.id}/subjects${qs}`, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json().catch(() => null)
    if (data?.subjects) setSubjects(data.subjects)
  }

  async function toggleArchived() {
    const next = !showArchived
    setShowArchived(next)
    setLoadingArchived(true)
    await reload(next)
    setLoadingArchived(false)
  }

  const active = subjects.filter((s) => !s.archivedAt)
  const archived = subjects.filter((s) => !!s.archivedAt)

  async function handleRestore(item: Subject) {
    const res = await fetch(`/api/subjects/${item.id}/restore`, { method: 'POST' })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      toast.error(body?.error?.message || 'Could not restore subject')
      return
    }
    toast.success(`${item.name} restored`)
    await reload(showArchived)
    startTransition(() => router.refresh())
  }

  const levelDisplay =
    cls.level === 'junior'
      ? LEVEL_LABEL.junior
      : cls.level === 'senior'
        ? LEVEL_LABEL.senior
        : 'Level not specified'

  const subjectCount = active.length
  const subjectCountLabel =
    subjectCount === 0 ? 'No subjects yet' : subjectCount === 1 ? '1 subject' : `${subjectCount} subjects`

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link
            href="/dashboard/classes"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to classes
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Class structure
        </p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
          {cls.name}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          {levelDisplay} · {subjectCountLabel} · Updated {formatDate(cls.updatedAt)}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New subject
          </button>

          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={toggleArchived}
              className="rounded border-border"
            />
            Show archived
          </label>
        </div>

        {active.length === 0 && (
          <div className="mt-10 rounded-xl border bg-card px-6 py-12 text-center">
            <p className="text-base text-muted-foreground">
              No subjects yet. Add Mathematics to get started.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              + New subject
            </button>
          </div>
        )}

        {active.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Subjects
            </h2>
            <div className="overflow-hidden rounded-xl border bg-card divide-y">
              {active.map((s) => (
                <SubjectRow
                  key={s.id}
                  item={s}
                  onEdit={() => setEditing(s)}
                  onArchive={() => setArchiving(s)}
                  onPickTeacher={() => setPickingTeacherFor(s)}
                />
              ))}
            </div>
          </section>
        )}

        {showArchived && (
          <section className="mt-12">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Archived
            </h2>
            {loadingArchived && archived.length === 0 && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {!loadingArchived && archived.length === 0 && (
              <p className="text-sm text-muted-foreground">No archived subjects.</p>
            )}
            {archived.length > 0 && (
              <div className="overflow-hidden rounded-xl border bg-card divide-y">
                {archived.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Archived {formatDate(s.archivedAt!)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(s)}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {createOpen && (
        <SubjectFormDialog
          mode="create"
          classId={cls.id}
          onClose={() => setCreateOpen(false)}
          onSaved={async () => {
            setCreateOpen(false)
            await reload(showArchived)
            startTransition(() => router.refresh())
          }}
        />
      )}

      {editing && (
        <SubjectFormDialog
          mode="edit"
          classId={cls.id}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await reload(showArchived)
            startTransition(() => router.refresh())
          }}
        />
      )}

      {archiving && (
        <ArchiveSubjectDialog
          item={archiving}
          onClose={() => setArchiving(null)}
          onArchived={async () => {
            setArchiving(null)
            await reload(showArchived)
            startTransition(() => router.refresh())
          }}
        />
      )}

      {pickingTeacherFor && (
        <TeacherPickerDialog
          subject={pickingTeacherFor as SubjectForPicker}
          onClose={() => setPickingTeacherFor(null)}
          onSaved={async () => {
            setPickingTeacherFor(null)
            await reload(showArchived)
            startTransition(() => router.refresh())
          }}
        />
      )}
    </div>
  )
}

function SubjectRow({
  item,
  onEdit,
  onArchive,
  onPickTeacher,
}: {
  item: Subject
  onEdit: () => void
  onArchive: () => void
  onPickTeacher: () => void
}) {
  const teacherName = item.teacher
    ? `${item.teacher.firstName} ${item.teacher.lastName}`.trim()
    : null

  return (
    <div className="flex items-center justify-between px-6 py-4 gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.name}</p>
        {teacherName ? (
          <p className="text-xs text-muted-foreground">
            Teacher: <span className="text-foreground">{teacherName}</span>
          </p>
        ) : (
          <p className="text-xs text-amber-600">⚠ Unassigned</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onPickTeacher}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          {teacherName ? 'Change' : 'Assign'}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onArchive}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          Archive
        </button>
      </div>
    </div>
  )
}

function SubjectFormDialog({
  mode,
  classId,
  initial,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  classId: string
  initial?: Subject
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Subject name is required')
      return
    }
    if (trimmed.length > 50) {
      setError('Subject name must be 50 characters or fewer')
      return
    }

    setSubmitting(true)
    const url =
      mode === 'create' ? `/api/classes/${classId}/subjects` : `/api/subjects/${initial!.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    setSubmitting(false)

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error?.message || 'Could not save subject')
      return
    }

    toast.success(mode === 'create' ? `${trimmed} created` : `${trimmed} updated`)
    await onSaved()
  }

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
          {mode === 'create' ? 'Add a subject' : 'Edit subject'}
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="subject-name" className="block text-xs font-medium text-foreground">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="subject-name"
              type="text"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Mathematics"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              e.g. Mathematics, English Language, Basic Science
            </p>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ArchiveSubjectDialog({
  item,
  onClose,
  onArchived,
}: {
  item: Subject
  onClose: () => void
  onArchived: () => void | Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)

  async function confirm() {
    setSubmitting(true)
    const res = await fetch(`/api/subjects/${item.id}/archive`, { method: 'POST' })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      toast.error(body?.error?.message || 'Could not archive subject')
      return
    }
    toast.success(`${item.name} archived`)
    await onArchived()
  }

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
          Archive {item.name}?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Archiving makes this subject inaccessible until you restore it. Future lesson notes and
          assessments can&apos;t be created for this subject. Existing content remains intact and
          viewable.
          <br />
          <br />
          Archiving is fully reversible.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={submitting}
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Archiving…' : 'Yes, archive'}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
}
