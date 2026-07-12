'use client'
// app/dashboard/students/students-client.tsx
// ops-1b-students-client

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

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

export function StudentsClient({
  initialClasses,
  initialStudents,
}: {
  initialClasses: ClassItem[]
  initialStudents: Student[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [classFilter, setClassFilter] = useState<string>('')
  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [archiving, setArchiving] = useState<Student | null>(null)
  const [loading, setLoading] = useState(false)

  const activeClasses = initialClasses.filter((c) => !c.archivedAt)

  async function reload(opts?: { classId?: string; includeArchived?: boolean }) {
    const classId = opts?.classId ?? classFilter
    const includeArchived = opts?.includeArchived ?? showArchived
    const params = new URLSearchParams()
    if (classId) params.set('classId', classId)
    if (includeArchived) params.set('includeArchived', 'true')
    const qs = params.toString() ? `?${params.toString()}` : ''
    setLoading(true)
    const res = await fetch(`/api/students${qs}`, { cache: 'no-store' })
    setLoading(false)
    if (!res.ok) { toast.error('Could not load students'); return }
    const data = await res.json().catch(() => null)
    if (data?.students) setStudents(data.students)
  }

  async function onClassFilter(v: string) {
    setClassFilter(v)
    await reload({ classId: v })
  }
  async function onToggleArchived() {
    const next = !showArchived
    setShowArchived(next)
    await reload({ includeArchived: next })
  }

  const active = students.filter((s) => !s.archivedAt)
  const archived = students.filter((s) => !!s.archivedAt)

  function classNameOf(s: Student): string {
    return s.class?.name ?? initialClasses.find((c) => c.id === s.classId)?.name ?? '—'
  }

  async function handleRestore(item: Student) {
    const res = await fetch(`/api/students/${item.id}/restore`, { method: 'POST' })
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not restore student')
      return
    }
    toast.success(`${item.firstName} ${item.lastName} restored`)
    await reload()
    startTransition(() => router.refresh())
  }

  const canAdd = activeClasses.length > 0

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
          Operations
        </p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
          Students
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Your school roster. Students are the spine of results, report cards, attendance, and fees.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={!canAdd}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            + New student
          </button>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Class
              <select
                value={classFilter}
                onChange={(e) => onClassFilter(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              >
                <option value="">All classes</option>
                {activeClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showArchived} onChange={onToggleArchived} className="rounded border-border" />
              Show archived
            </label>
          </div>
        </div>

        {!canAdd && (
          <div className="mt-6 rounded-lg border border-amber-300/50 bg-amber-50/50 px-4 py-3 text-xs text-amber-700">
            Add a class first — students are enrolled into a class. Head to{' '}
            <Link href="/dashboard/classes" className="font-medium underline">Classes</Link>.
          </div>
        )}

        {loading && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}

        {!loading && active.length === 0 && (
          <div className="mt-10 rounded-xl border bg-card px-6 py-12 text-center">
            <p className="text-base text-muted-foreground">
              {classFilter ? 'No students in this class yet.' : 'No students yet. Add your first to get started.'}
            </p>
            {canAdd && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                + New student
              </button>
            )}
          </div>
        )}

        {!loading && active.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {active.length === 1 ? '1 student' : `${active.length} students`}
            </h2>
            <div className="overflow-hidden rounded-xl border bg-card divide-y">
              {active.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl.replace('/upload/', '/upload/w_72,h_72,c_fill,g_face,q_auto,f_auto/')}
                        alt=""
                        className="h-10 w-10 flex-shrink-0 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-[10px] uppercase text-muted-foreground">
                        {(s.firstName[0] || '') + (s.lastName[0] || '')}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.lastName} {s.firstName}{s.middleName ? ` ${s.middleName}` : ''}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{s.admissionNumber}</span> · {classNameOf(s)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => setEditing(s)} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Edit</button>
                    <button type="button" onClick={() => setArchiving(s)} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Archive</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showArchived && (
          <section className="mt-12">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Archived</h2>
            {archived.length === 0 ? (
              <p className="text-sm text-muted-foreground">No archived students.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card divide-y">
                {archived.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium">{s.lastName} {s.firstName}</p>
                      <p className="text-xs text-muted-foreground"><span className="font-mono">{s.admissionNumber}</span> · {classNameOf(s)}</p>
                    </div>
                    <button type="button" onClick={() => handleRestore(s)} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Restore</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {createOpen && (
        <StudentFormDialog
          mode="create"
          classes={activeClasses}
          onClose={() => setCreateOpen(false)}
          onSaved={async () => { setCreateOpen(false); await reload(); startTransition(() => router.refresh()) }}
        />
      )}
      {editing && (
        <StudentFormDialog
          mode="edit"
          classes={activeClasses}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await reload(); startTransition(() => router.refresh()) }}
        />
      )}
      {archiving && (
        <ArchiveStudentDialog
          item={archiving}
          onClose={() => setArchiving(null)}
          onArchived={async () => { setArchiving(null); await reload(); startTransition(() => router.refresh()) }}
        />
      )}
    </div>
  )
}

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm'

function StudentFormDialog({
  mode,
  classes,
  initial,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  classes: ClassItem[]
  initial?: Student
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const [admissionNumber, setAdmissionNumber] = useState(initial?.admissionNumber ?? '')
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [middleName, setMiddleName] = useState(initial?.middleName ?? '')
  const [classId, setClassId] = useState(initial?.classId ?? (classes[0]?.id ?? ''))
  const [gender, setGender] = useState(initial?.gender ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth ? initial.dateOfBirth.slice(0, 10) : '')
  const [guardianName, setGuardianName] = useState(initial?.guardianName ?? '')
  const [guardianPhone, setGuardianPhone] = useState(initial?.guardianPhone ?? '')
  const [guardianEmail, setGuardianEmail] = useState(initial?.guardianEmail ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photoUrl ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!admissionNumber.trim()) { setError('Admission number is required'); return }
    if (!firstName.trim()) { setError('First name is required'); return }
    if (!lastName.trim()) { setError('Last name is required'); return }
    if (!classId) { setError('Please choose a class'); return }

    const payload = {
      admissionNumber: admissionNumber.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName.trim() || null,
      classId,
      gender: gender || null,
      dateOfBirth: dateOfBirth || null,
      guardianName: guardianName.trim() || null,
      guardianPhone: guardianPhone.trim() || null,
      guardianEmail: guardianEmail.trim() || null,
      photoUrl: photoUrl,
    }

    setSubmitting(true)
    const url = mode === 'create' ? '/api/students' : `/api/students/${initial!.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSubmitting(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      setError(b?.error?.message || 'Could not save student')
      return
    }
    toast.success(mode === 'create' ? 'Student added' : 'Student updated')
    await onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl font-medium leading-tight tracking-tight">
          {mode === 'create' ? 'Add a student' : 'Edit student'}
        </h2>

        <div className="mt-6 space-y-5">
          <StudentPhotoUpload currentUrl={photoUrl} onUploaded={setPhotoUrl} onRemoved={() => setPhotoUrl(null)} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium">Admission number <span className="text-red-500">*</span></label>
              <input type="text" value={admissionNumber} maxLength={40} onChange={(e) => setAdmissionNumber(e.target.value)} className={inputClass + ' font-mono'} placeholder="e.g. KR/2026/001" />
            </div>
            <div>
              <label className="block text-xs font-medium">Class <span className="text-red-500">*</span></label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputClass}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium">First name <span className="text-red-500">*</span></label>
              <input type="text" value={firstName} maxLength={60} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium">Middle name</label>
              <input type="text" value={middleName} maxLength={60} onChange={(e) => setMiddleName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium">Last name <span className="text-red-500">*</span></label>
              <input type="text" value={lastName} maxLength={60} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                <option value="">Not specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium">Date of birth</label>
              <input type="date" value={dateOfBirth} min={new Date(Date.now() - 30 * 365.25 * 86400000).toISOString().slice(0, 10)} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} /> {/* bugfix-age-dob-v1 */}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Guardian</p>
            <div>
              <label className="block text-xs font-medium">Name</label>
              <input type="text" value={guardianName} maxLength={100} onChange={(e) => setGuardianName(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium">Phone</label>
                <input type="tel" value={guardianPhone} maxLength={30} onChange={(e) => setGuardianPhone(e.target.value)} className={inputClass} placeholder="+234 800 000 0000" />
              </div>
              <div>
                <label className="block text-xs font-medium">Email</label>
                <input type="email" value={guardianEmail} maxLength={120} onChange={(e) => setGuardianEmail(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button type="button" onClick={submit} disabled={submitting} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StudentPhotoUpload({
  currentUrl,
  onUploaded,
  onRemoved,
}: {
  currentUrl: string | null
  onUploaded: (url: string) => void
  onRemoved: () => void
}) {
  type Phase = 'idle' | 'validating' | 'signing' | 'uploading'
  const [phase, setPhase] = useState<Phase>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const MAX_BYTES = 2 * 1024 * 1024
  const busy = phase !== 'idle'
  const label: Record<Phase, string> = { idle: '', validating: 'Checking…', signing: 'Preparing…', uploading: 'Uploading…' }

  function openPicker() { inputRef.current?.click() }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhase('validating')
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); setPhase('idle'); return }
    if (file.size > MAX_BYTES) { toast.error('Image must be 2MB or less'); setPhase('idle'); return }
    try {
      setPhase('signing')
      const sigRes = await fetch('/api/students/photo-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!sigRes.ok) {
        const d = await sigRes.json().catch(() => ({}))
        throw new Error(d?.error?.message ?? 'Could not prepare upload')
      }
      const sig = await sigRes.json()
      setPhase('uploading')
      const form = new FormData()
      form.append('file', file)
      form.append('api_key', sig.apiKey)
      form.append('timestamp', String(sig.timestamp))
      form.append('signature', sig.signature)
      form.append('upload_preset', sig.preset)
      form.append('folder', sig.folder)
      form.append('public_id', sig.publicId)
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form })
      if (!up.ok) throw new Error('Upload failed. Please try again.')
      const ud = await up.json()
      if (!ud.secure_url) throw new Error('Upload failed. Please try again.')
      onUploaded(ud.secure_url)
      setPhase('idle')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setPhase('idle')
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {currentUrl ? (
        <img src={currentUrl.replace('/upload/', '/upload/w_144,h_144,c_fill,g_face,q_auto,f_auto/')} alt="Passport" className="h-16 w-16 rounded-full border border-border object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-border bg-muted/30 text-[10px] uppercase text-muted-foreground">Photo</div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={openPicker} disabled={busy} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
          {busy ? label[phase] : currentUrl ? 'Replace photo' : 'Upload photo'}
        </button>
        {currentUrl && !busy && (
          <button type="button" onClick={onRemoved} className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Remove</button>
        )}
      </div>
    </div>
  )
}

function ArchiveStudentDialog({
  item,
  onClose,
  onArchived,
}: {
  item: Student
  onClose: () => void
  onArchived: () => void | Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  async function confirm() {
    setSubmitting(true)
    const res = await fetch(`/api/students/${item.id}/archive`, { method: 'POST' })
    setSubmitting(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not archive student')
      return
    }
    toast.success(`${item.firstName} ${item.lastName} archived`)
    await onArchived()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl font-medium leading-tight tracking-tight">Archive {item.firstName} {item.lastName}?</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Archiving removes this student from active rosters and score entry. Existing results and report cards remain intact. Archiving is fully reversible.
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button type="button" onClick={confirm} disabled={submitting} className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors">
            {submitting ? 'Archiving…' : 'Yes, archive'}
          </button>
        </div>
      </div>
    </div>
  )
}
