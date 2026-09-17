'use client'
// app/dashboard/my-class/my-class-client.tsx
// my-class-v1
//
// Roster + add + inline edit for the class(es) this teacher is class teacher of.
//
// Deliberately absent: admission number and class. The API 403s a TEACHER on
// both (students-teacher-write-v1), so putting them on the form would be a lie.
// Admission numbers are generated server-side. Archiving, restoring and bulk
// import stay on the admin's Students page.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

type ClassLite = { id: string; name: string }

type Student = {
  id: string
  admissionNumber: string
  firstName: string
  lastName: string
  middleName: string | null
  gender: string | null
  dateOfBirth: string | null
  guardianName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  archivedAt: string | null
}

// Exactly the fields a teacher is allowed to write.
type EditableFields = {
  firstName: string
  lastName: string
  middleName: string
  gender: string
  dateOfBirth: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
}

const BLANK: EditableFields = {
  firstName: '', lastName: '', middleName: '', gender: '',
  dateOfBirth: '', guardianName: '', guardianPhone: '', guardianEmail: '',
}

function toForm(s: Student): EditableFields {
  return {
    firstName: s.firstName ?? '',
    lastName: s.lastName ?? '',
    middleName: s.middleName ?? '',
    gender: s.gender ?? '',
    dateOfBirth: s.dateOfBirth ? String(s.dateOfBirth).slice(0, 10) : '',
    guardianName: s.guardianName ?? '',
    guardianPhone: s.guardianPhone ?? '',
    guardianEmail: s.guardianEmail ?? '',
  }
}

// Empty strings are sent as null so a cleared field actually clears.
function toPayload(f: EditableFields) {
  const out: Record<string, string | null> = {}
  for (const [k, v] of Object.entries(f)) {
    const t = v.trim()
    if (k === 'firstName' || k === 'lastName') out[k] = t
    else out[k] = t === '' ? null : t
  }
  return out
}

export function MyClassClient({ classes }: { classes: ClassLite[] }) {
  const [classId, setClassId] = useState<string>(classes[0]?.id ?? '')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<EditableFields>(BLANK)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditableFields>(BLANK)

  const load = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    const res = await fetch(`/api/students?classId=${encodeURIComponent(id)}`, { cache: 'no-store' }).catch(() => null)
    setLoading(false)
    if (!res || !res.ok) { toast.error('Could not load your class list'); return }
    const data = await res.json().catch(() => null)
    setStudents(Array.isArray(data?.students) ? data.students : [])
  }, [])

  useEffect(() => { load(classId) }, [classId, load])

  const className = classes.find((c) => c.id === classId)?.name ?? ''

  async function createStudent() {
    if (!addForm.firstName.trim() || !addForm.lastName.trim()) {
      toast.error('First name and last name are required'); return
    }
    setSaving(true)
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...toPayload(addForm), classId }),
    })
    setSaving(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not add the student')
      return
    }
    toast.success(`${addForm.firstName.trim()} added to ${className}`)
    setAddForm(BLANK)
    setAddOpen(false)
    await load(classId)
  }

  function startEdit(s: Student) {
    setEditingId(s.id)
    setEditForm(toForm(s))
  }

  async function saveEdit() {
    if (!editingId) return
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      toast.error('First name and last name are required'); return
    }
    setSaving(true)
    const res = await fetch(`/api/students/${encodeURIComponent(editingId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPayload(editForm)),
    })
    setSaving(false)
    if (!res.ok) {
      const b = await res.json().catch(() => null)
      toast.error(b?.error?.message || 'Could not save the changes')
      return
    }
    toast.success('Saved')
    setEditingId(null)
    await load(classId)
  }

  return (
    <Shell>
      {classes.length > 1 && (
        <div className="mt-10 rounded-xl border bg-card p-4">
          <label className="text-xs text-muted-foreground">Class
            <select
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setEditingId(null); setAddOpen(false) }}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground sm:w-64"
            >
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {className} · {students.length} student{students.length === 1 ? '' : 's'}
        </h2>
        <button
          type="button"
          onClick={() => { setAddOpen((v) => !v); setEditingId(null) }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {addOpen ? 'Cancel' : '+ Add student'}
        </button>
      </div>

      {addOpen && (
        <div className="mt-4 rounded-xl border bg-card p-6">
          <p className="mb-4 text-sm font-medium">New student in {className}</p>
          <Fields form={addForm} onChange={setAddForm} />
          <p className="mt-3 text-xs text-muted-foreground">
            The admission number is generated automatically. To move a student to another
            class, or change an admission number, ask your school admin.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => { setAddOpen(false); setAddForm(BLANK) }} className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="button" onClick={createStudent} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? 'Adding…' : 'Add student'}
            </button>
          </div>
        </div>
      )}

      <section className="mt-6">
        {loading ? (
          <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : students.length === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No students in {className} yet. Add the first one above.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card divide-y">
            {students.map((s) => (
              <div key={s.id} className="px-5 py-4">
                {editingId === s.id ? (
                  <div>
                    <p className="mb-3 font-mono text-[11px] text-muted-foreground">{s.admissionNumber}</p>
                    <Fields form={editForm} onChange={setEditForm} />
                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Cancel</button>
                      <button type="button" onClick={saveEdit} disabled={saving} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">
                        {s.lastName} {s.firstName}
                        {s.archivedAt ? <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground align-middle">Left</span> : null}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">{s.admissionNumber}</p>
                      {s.guardianPhone ? <p className="mt-0.5 text-xs text-muted-foreground">Guardian: {s.guardianName || '—'} · {s.guardianPhone}</p> : null}
                    </div>
                    <button type="button" onClick={() => startEdit(s)} className="flex-shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </Shell>
  )
}

function Fields({ form, onChange }: { form: EditableFields; onChange: (f: EditableFields) => void }) {
  function set(k: keyof EditableFields, v: string) { onChange({ ...form, [k]: v }) }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Text label="First name *" value={form.firstName} onChange={(v) => set('firstName', v)} />
      <Text label="Last name *" value={form.lastName} onChange={(v) => set('lastName', v)} />
      <Text label="Middle name" value={form.middleName} onChange={(v) => set('middleName', v)} />
      <Text label="Gender" value={form.gender} onChange={(v) => set('gender', v)} />
      <Text label="Date of birth" value={form.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} type="date" />
      <Text label="Guardian name" value={form.guardianName} onChange={(v) => set('guardianName', v)} />
      <Text label="Guardian phone" value={form.guardianPhone} onChange={(v) => set('guardianPhone', v)} />
      <Text label="Guardian email" value={form.guardianEmail} onChange={(v) => set('guardianEmail', v)} type="email" />
    </div>
  )
}

function Text({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
    </label>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to dashboard</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">Your class</p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">My class</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          The students in the class you are class teacher of. Add a new student, or correct a
          name or guardian detail without waiting on the school admin.
        </p>
        {children}
      </div>
    </div>
  )
}
