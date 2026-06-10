'use client'
// app/dashboard/classes/classes-client.tsx
// batch-2c-phase-2-classes-client

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

type ClassItem = {
  id: string
  name: string
  level: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  _count: { subjects: number }
}

type LevelValue = 'junior' | 'senior' | ''

const LEVEL_LABEL: Record<string, string> = {
  junior: 'Junior secondary',
  senior: 'Senior secondary',
}

export function ClassesClient({ initialClasses }: { initialClasses: ClassItem[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses)
  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<ClassItem | null>(null)
  const [archiving, setArchiving] = useState<ClassItem | null>(null)
  const [loadingArchived, setLoadingArchived] = useState(false)

  // fix-5-prop-sync: router.refresh() re-runs the server component, but
  // useState locks the first initialClasses — sync on prop change.
  useEffect(() => {
    setClasses(initialClasses)
  }, [initialClasses])

  async function reload(includeArchived: boolean) {
    const qs = includeArchived ? '?includeArchived=true' : ''
    const res = await fetch(`/api/classes${qs}`, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json().catch(() => null)
    if (data?.classes) setClasses(data.classes)
  }

  async function toggleArchived() {
    const next = !showArchived
    setShowArchived(next)
    setLoadingArchived(true)
    await reload(next)
    setLoadingArchived(false)
  }

  const active = classes.filter((c) => !c.archivedAt)
  const archived = classes.filter((c) => !!c.archivedAt)

  // Group active by level
  const grouped: Record<string, ClassItem[]> = { junior: [], senior: [], '': [] }
  for (const c of active) {
    const key = c.level && (c.level === 'junior' || c.level === 'senior') ? c.level : ''
    grouped[key].push(c)
  }

  async function handleRestore(item: ClassItem) {
    const res = await fetch(`/api/classes/${item.id}/restore`, { method: 'POST' })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      toast.error(body?.error?.message || 'Could not restore class')
      return
    }
    toast.success(`${item.name} restored`)
    await reload(showArchived)
    startTransition(() => router.refresh())
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Academic structure
        </p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
          Classes & levels
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Set up the classes your school teaches. Each class becomes a target for
          lesson notes, assessments, and timetables.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New class
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
              No classes yet. Add JSS 1 to get started.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              + New class
            </button>
          </div>
        )}

        {active.length > 0 && (
          <div className="mt-10 space-y-10">
            {(['junior', 'senior', ''] as const).map((levelKey) => {
              const items = grouped[levelKey]
              if (items.length === 0) return null
              const header =
                levelKey === '' ? 'Not specified' : LEVEL_LABEL[levelKey]
              return (
                <section key={levelKey}>
                  <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {header}
                  </h2>
                  <div className="overflow-hidden rounded-xl border bg-card divide-y">
                    {items.map((c) => (
                      <ClassRow
                        key={c.id}
                        item={c}
                        onEdit={() => setEditing(c)}
                        onArchive={() => setArchiving(c)}
                        clickable={!c.archivedAt}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
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
              <p className="text-sm text-muted-foreground">No archived classes.</p>
            )}
            {archived.length > 0 && (
              <div className="overflow-hidden rounded-xl border bg-card divide-y">
                {archived.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Archived {formatDate(c.archivedAt!)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(c)}
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
        <ClassFormDialog
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSaved={async () => {
            setCreateOpen(false)
            await reload(showArchived)
            startTransition(() => router.refresh())
          }}
        />
      )}

      {editing && (
        <ClassFormDialog
          mode="edit"
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
        <ArchiveConfirmDialog
          item={archiving}
          onClose={() => setArchiving(null)}
          onArchived={async () => {
            setArchiving(null)
            await reload(showArchived)
            startTransition(() => router.refresh())
          }}
        />
      )}
    </div>
  )
}

function ClassRow({
  item,
  onEdit,
  onArchive,
  clickable,
}: {
  item: ClassItem
  onEdit: () => void
  onArchive: () => void
  clickable: boolean
}) {
  const subjectLabel =
    item._count.subjects === 1 ? '1 subject' : `${item._count.subjects} subjects`
  const content = (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">{subjectLabel}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onArchive(); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          Archive
        </button>
      </div>
    </div>
  )
  // batch-2c-phase-3a-classes-clickable
  if (clickable) {
    return (
      <Link href={`/dashboard/classes/${item.id}`} className="block hover:bg-muted/40 transition-colors">
        {content}
      </Link>
    )
  }
  return content

}

function ClassFormDialog({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  initial?: ClassItem
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [level, setLevel] = useState<LevelValue>(
    (initial?.level === 'junior' || initial?.level === 'senior'
      ? (initial.level as LevelValue)
      : '')
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) { setError('Class name is required'); return }
    if (trimmed.length > 30) { setError('Class name must be 30 characters or fewer'); return }

    setSubmitting(true)
    const payload: Record<string, any> = { name: trimmed }
    payload.level = level === '' ? null : level

    const url = mode === 'create' ? '/api/classes' : `/api/classes/${initial!.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSubmitting(false)

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error?.message || 'Could not save class')
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
          {mode === 'create' ? 'Add a class' : 'Edit class'}
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="class-name" className="block text-xs font-medium text-foreground">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="class-name"
              type="text"
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. JSS 1"
            />
          </div>

          <div>
            <p className="block text-xs font-medium text-foreground">Level</p>
            <div className="mt-2 space-y-2">
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="level"
                  value="junior"
                  checked={level === 'junior'}
                  onChange={() => setLevel('junior')}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Junior secondary</span>
                  <span className="block text-xs text-muted-foreground">For JSS, primary, pre-school</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="level"
                  value="senior"
                  checked={level === 'senior'}
                  onChange={() => setLevel('senior')}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Senior secondary</span>
                  <span className="block text-xs text-muted-foreground">For SS, advanced levels</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="level"
                  value=""
                  checked={level === ''}
                  onChange={() => setLevel('')}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Not specified</span>
                  <span className="block text-xs text-muted-foreground">For nursery, crèche, or anything else</span>
                </span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
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

function ArchiveConfirmDialog({
  item,
  onClose,
  onArchived,
}: {
  item: ClassItem
  onClose: () => void
  onArchived: () => void | Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const hasSubjects = item._count.subjects > 0

  async function confirm() {
    setSubmitting(true)
    const res = await fetch(`/api/classes/${item.id}/archive`, { method: 'POST' })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      toast.error(body?.error?.message || 'Could not archive class')
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
          {hasSubjects ? (
            <>
              This class has {item._count.subjects === 1 ? '1 subject' : `${item._count.subjects} subjects`} attached.
              Archiving won&apos;t delete them, but they&apos;ll become inaccessible until you restore the class.
              Lesson notes and assessments already created remain intact.
            </>
          ) : (
            <>This class has no subjects yet. Archiving is fully reversible.</>
          )}
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
