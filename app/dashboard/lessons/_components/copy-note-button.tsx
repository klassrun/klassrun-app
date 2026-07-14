'use client'
// app/dashboard/lessons/_components/copy-note-button.tsx
// bugfix-dedup-copy-v1 — copy a lesson note to another class arm (zero AI cost)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Target = { classId: string; className: string }

export function CopyNoteButton({
  noteId,
  subjectName,
  targets,
}: {
  noteId: string
  subjectName: string
  targets: Target[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [classId, setClassId] = useState(targets[0]?.classId ?? '')
  const [busy, setBusy] = useState(false)

  async function copy() {
    if (!classId || busy) return
    setBusy(true)
    const res = await fetch(`/api/notes/${noteId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId }),
    })
    const data = await res.json().catch(() => null)
    setBusy(false)
    if (!res.ok) {
      toast.error(data?.error?.message || 'Could not copy lesson note')
      return
    }
    const newId = data?.note?.id
    toast.success('Lesson note copied')
    setOpen(false)
    if (newId) router.push(`/dashboard/lessons/${newId}`)
  }

  if (targets.length === 0) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
      >
        Copy to class
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="text-xs text-muted-foreground">
            Copy this {subjectName} note to another class you teach. No AI is used.
          </p>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {targets.map((t) => (
              <option key={t.classId} value={t.classId}>{t.className}</option>
            ))}
          </select>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={busy || !classId}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Copying…' : 'Copy note'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
