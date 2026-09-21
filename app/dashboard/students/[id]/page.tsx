// app/dashboard/students/[id]/page.tsx
// student-record-app-v1: one student's whole history — every session, class,
// term result and report card — including after they have left the school.

import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'

export const dynamic = 'force-dynamic'

type MeResponse = { user: { id: string; role: string } }
type TimelineItem = {
  sessionId: string
  sessionName: string | null
  isCurrentSession: boolean
  className: string | null
  outcome: { decision: 'PROMOTED' | 'RETAINED'; toClassName?: string | null; cumulative: number | null } | null
}
type TermRow = {
  sessionId: string
  sessionName: string | null
  term: 'FIRST' | 'SECOND' | 'THIRD'
  subjectsScored: number
  average: number | null
  attendance: { schoolOpened: number; present: number; absent: number } | null
  behaviourRated: boolean
  reportCard: { id: string; locked: boolean; pdfUrl: string | null; overallPosition: number | null; classSize: number | null; className: string | null } | null
}
type RecordResponse = {
  student: {
    id: string
    admissionNumber: string
    firstName: string
    middleName: string | null
    lastName: string
    gender: string | null
    dateOfBirth: string | null
    photoUrl: string | null
    guardianName: string | null
    guardianPhone: string | null
    guardianEmail: string | null
    currentClass: { id: string; name: string } | null
    status: 'ACTIVE' | 'LEFT'
    archivedAt: string | null
    createdAt: string
  }
  timeline: TimelineItem[]
  terms: TermRow[]
}

const TERM_LABEL: Record<string, string> = { FIRST: 'First Term', SECOND: 'Second Term', THIRD: 'Third Term' }
const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 - n % 10 === 10 ? 0 : n % 10)] || 'th'}`
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

export default async function StudentRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const token = await getAuthCookie()
  if (!token) redirect('/login')
  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data?.user) redirect('/login')
  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const { id } = await params
  const result = await apiFetch<RecordResponse>(`/api/students/${encodeURIComponent(id)}/record`, { token })
  if (!result.ok || !result.data) notFound()
  const { student, timeline, terms } = result.data
  const fullName = [student.lastName, student.firstName, student.middleName].filter(Boolean).join(' ')

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard/students" className="text-sm text-muted-foreground transition-colors hover:text-foreground">← Back to students</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">Student record</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {student.photoUrl ? (
              <img src={student.photoUrl.replace('/upload/', '/upload/w_144,h_144,c_fill,g_face,q_auto,f_auto/')} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-border bg-muted/30 text-xs uppercase text-muted-foreground">
                {(student.firstName[0] || '') + (student.lastName[0] || '')}
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl font-medium leading-tight tracking-tight">{fullName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-mono">{student.admissionNumber}</span>
                {student.currentClass ? ` · ${student.currentClass.name}` : ''}
                {student.gender ? ` · ${student.gender}` : ''}
                {student.dateOfBirth ? ` · born ${fmtDate(student.dateOfBirth)}` : ''}
              </p>
            </div>
          </div>
          {student.status === 'LEFT' ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Left · {fmtDate(student.archivedAt)}</span>
          ) : (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">Active</span>
          )}
        </div>
        {(student.guardianName || student.guardianPhone || student.guardianEmail) && (
          <p className="mt-4 text-sm text-muted-foreground">
            Guardian: {[student.guardianName, student.guardianPhone, student.guardianEmail].filter(Boolean).join(' · ')}
          </p>
        )}

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Class history</h2>
          {timeline.length === 0 ? (
            <p className="rounded-xl border bg-card px-5 py-4 text-sm text-muted-foreground">No class history recorded.</p>
          ) : (
            <ol className="overflow-hidden rounded-xl border bg-card divide-y">
              {timeline.map((t) => (
                <li key={t.sessionId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium">{t.sessionName ?? 'Session'} · {t.className ?? 'Unknown class'}</p>
                    {t.isCurrentSession && <p className="text-xs text-primary">Current session</p>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.outcome
                      ? t.outcome.decision === 'PROMOTED'
                        ? `Promoted to ${t.outcome.toClassName ?? 'next class'}${t.outcome.cumulative != null ? ` · avg ${t.outcome.cumulative}` : ''}`
                        : `Repeated the class${t.outcome.cumulative != null ? ` · avg ${t.outcome.cumulative}` : ''}`
                      : t.isCurrentSession ? 'In progress' : 'No promotion recorded'}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Term by term</h2>
          {terms.length === 0 ? (
            <p className="rounded-xl border bg-card px-5 py-4 text-sm text-muted-foreground">No scores, attendance or report cards recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Session · Term</th>
                    <th className="px-2 py-3 text-center font-medium">Subjects</th>
                    <th className="px-2 py-3 text-center font-medium">Average</th>
                    <th className="px-2 py-3 text-center font-medium">Position</th>
                    <th className="px-2 py-3 text-center font-medium">Attendance</th>
                    <th className="px-2 py-3 text-center font-medium">Behaviour</th>
                    <th className="px-4 py-3 text-right font-medium">Report card</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {terms.map((t) => (
                    <tr key={`${t.sessionId}-${t.term}`} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">{t.sessionName ?? 'Session'} · {TERM_LABEL[t.term] ?? t.term}</td>
                      <td className="px-2 py-2.5 text-center">{t.subjectsScored || '—'}</td>
                      <td className="px-2 py-2.5 text-center">{t.average ?? '—'}</td>
                      <td className="px-2 py-2.5 text-center">
                        {t.reportCard?.overallPosition ? `${ordinal(t.reportCard.overallPosition)}${t.reportCard.classSize ? ` of ${t.reportCard.classSize}` : ''}` : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center">{t.attendance ? `${t.attendance.present}/${t.attendance.schoolOpened}` : '—'}</td>
                      <td className="px-2 py-2.5 text-center">{t.behaviourRated ? 'Rated' : '—'}</td>
                      <td className="px-4 py-2.5 text-right">
                        {t.reportCard ? (
                          <span className="inline-flex items-center gap-2">
                            <Link href={`/dashboard/report-cards/${t.reportCard.id}`} className="text-xs font-medium text-primary hover:underline">Open{t.reportCard.locked ? ' (locked)' : ''}</Link>
                            {t.reportCard.pdfUrl && <a href={t.reportCard.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">PDF</a>}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">Not generated</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Records are never deleted. Promotions, class moves and leaving the school all keep this history intact.
          </p>
        </section>
      </div>
    </div>
  )
}
