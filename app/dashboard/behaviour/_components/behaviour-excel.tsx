'use client'
// app/dashboard/behaviour/_components/behaviour-excel.tsx
// behaviour-bulk-app-v1
//
// Download the class's behaviour sheet (every student listed, saved ratings
// filled in), rate in Excel, upload it back. The API validates (preview) and
// saves only valid, changed rows. A row left completely blank is skipped, so
// an upload never wipes anyone's ratings.

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import writeXlsxFile from 'write-excel-file/browser'
import readXlsxFile from 'read-excel-file/browser'
import { sheetRows } from '../../results/_components/bulk-scores'

export type BehaviourRosterRow = {
  student: { admissionNumber: string; firstName: string; lastName: string }
  ratings: Record<string, number>
  hasEntry: boolean
}
type ParsedRow = { row: number; admissionNumber: string; ratings: Record<string, number | string> }
type PreviewRow = { row: number; admissionNumber: string; name?: string; status: 'ok' | 'unchanged' | 'skipped' | 'error'; message?: string }
type PreviewData = {
  summary: { rows: number; ok: number; unchanged: number; skipped: number; errors: number; saved: number }
  rows: PreviewRow[]
}

export const traitHeader = (attr: string) => `${attr} (1-5)`

// Sheet rows -> API rows. Throws with a message a teacher can act on.
export function parseBehaviourSheet(sheet: unknown[][], attributes: string[]): ParsedRow[] {
  if (!Array.isArray(sheet) || sheet.length < 2) throw new Error('The file has no student rows')
  const header = (sheet[0] || []).map((c) => String(c ?? '').trim().toLowerCase())
  const admissionCol = header.findIndex((h) => h.startsWith('admission'))
  if (admissionCol === -1) throw new Error('No "Admission No" column found. Download the template and fill that one in.')
  const cols = attributes.map((a) => {
    const want = a.trim().toLowerCase()
    return header.findIndex((h) => h === want || h.startsWith(want + ' ('))
  })
  const missing = attributes.filter((_, i) => cols[i] === -1)
  if (missing.length > 0) throw new Error(`These columns are missing: ${missing.join(', ')}. Download the template again.`)
  const out: ParsedRow[] = []
  for (let i = 1; i < sheet.length; i++) {
    const r = sheet[i] || []
    const admissionNumber = String(r[admissionCol] ?? '').trim()
    const ratings: Record<string, number | string> = {}
    attributes.forEach((a, k) => {
      const v = r[cols[k]]
      ratings[a] = v === null || v === undefined ? '' : typeof v === 'number' ? v : String(v).trim()
    })
    const blank = !admissionNumber && attributes.every((a) => ratings[a] === '')
    if (!blank) out.push({ row: i + 1, admissionNumber, ratings })
  }
  if (out.length === 0) throw new Error('No student rows found in the file')
  return out
}

export function BehaviourExcel({
  classId, sessionId, term, className, attributes, roster, onSaved,
}: {
  classId: string
  sessionId: string
  term: string
  className: string
  attributes: string[]
  roster: BehaviourRosterRow[]
  onSaved: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'idle' | 'reading' | 'previewing' | 'saving'>('idle')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const working = busy !== 'idle'

  async function download() {
    const bold = 'bold' as const
    const head = [
      { value: 'Admission No', fontWeight: bold },
      { value: 'Student', fontWeight: bold },
      ...attributes.map((a) => ({ value: traitHeader(a), fontWeight: bold })),
    ]
    const body = roster.map((r) => [
      { value: r.student.admissionNumber, type: String },
      { value: `${r.student.lastName} ${r.student.firstName}`, type: String },
      ...attributes.map((a) => (typeof r.ratings?.[a] === 'number' ? { value: r.ratings[a], type: Number } : null)),
    ])
    const fileName = `${className}-Behaviour-${term}`.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '-')
    try {
      await writeXlsxFile([head, ...body], {
        columns: [{ width: 20 }, { width: 28 }, ...attributes.map(() => ({ width: 15 }))],
      }).toFile(`${fileName}.xlsx`)
      toast.success('Template downloaded — rate each trait 1 to 5 and upload it back')
    } catch {
      toast.error('Could not build the template')
    }
  }

  async function send(mode: 'preview' | 'save', rows: ParsedRow[]) {
    setBusy(mode === 'preview' ? 'previewing' : 'saving')
    try {
      const res = await fetch('/api/behaviour/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, sessionId, term, mode, rows }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error?.message ?? 'Upload failed'); return }
      setPreview(data as PreviewData)
      if (mode === 'save') {
        const saved = (data as PreviewData).summary.saved
        toast.success(`Saved ratings for ${saved} student${saved === 1 ? '' : 's'}`)
        onSaved()
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setBusy('idle')
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy('reading')
    setPreview(null)
    let rows: ParsedRow[]
    try {
      rows = parseBehaviourSheet(sheetRows(await readXlsxFile(file)), attributes)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read the file')
      setBusy('idle')
      return
    }
    setParsed(rows)
    await send('preview', rows)
  }

  const problems = preview ? preview.rows.filter((r) => r.status === 'error') : []
  const canSave = !!preview && preview.summary.ok > 0 && preview.summary.saved === 0

  return (
    <div className="mb-6 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Rate the whole class in Excel</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Download the sheet with every student listed, rate each trait 1 to 5, then upload it back.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={download} disabled={working || roster.length === 0} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50">
            Download template
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={working} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {busy === 'reading' ? 'Reading…' : busy === 'previewing' ? 'Checking…' : 'Upload filled template'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={onFile} />
        </div>
      </div>

      {preview && (
        <div className="mt-5 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{preview.summary.ok} to save</span>
            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">{preview.summary.unchanged} unchanged</span>
            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">{preview.summary.skipped} blank</span>
            <span className={['rounded-full px-2.5 py-1 font-medium', preview.summary.errors > 0 ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'].join(' ')}>
              {preview.summary.errors} with problems
            </span>
            {preview.summary.saved > 0 && <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">Saved {preview.summary.saved}</span>}
          </div>
          {problems.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-lg border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-left uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Admission No</th>
                    <th className="px-3 py-2 font-medium">Problem</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {problems.slice(0, 20).map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">{p.row}</td>
                      <td className="px-3 py-1.5 font-mono">{p.admissionNumber || '—'}</td>
                      <td className="px-3 py-1.5 text-red-700">{p.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {problems.length > 20 && <p className="px-3 py-2 text-[11px] text-muted-foreground">and {problems.length - 20} more…</p>}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => send('save', parsed)} disabled={!canSave || working} className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {busy === 'saving' ? 'Saving…' : `Save ${preview.summary.ok} row${preview.summary.ok === 1 ? '' : 's'}`}
            </button>
            <button type="button" onClick={() => { setPreview(null); setParsed([]) }} disabled={working} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50">
              Clear
            </button>
            <p className="text-[11px] text-muted-foreground">Rows with problems are never saved — fix them in the sheet and upload again, or rate them in the grid below.</p>
          </div>
        </div>
      )}
    </div>
  )
}
