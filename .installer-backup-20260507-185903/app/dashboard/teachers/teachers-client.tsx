'use client'

// app/dashboard/teachers/teachers-client.tsx
//
// Client component for the teacher management UI. The parent server
// component fetches the initial list; this component handles the
// interactive parts: inviting, revoking, resetting.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Teacher = {
  id: string
  email: string
  firstName: string
  lastName: string
  status: 'ACTIVE' | 'INVITED' | 'REVOKED'
  createdAt: string
}

export function TeachersClient({ initialTeachers }: { initialTeachers: Teacher[] }) {
  const router = useRouter()
  const [teachers, setTeachers] = useState(initialTeachers)
  const [actionInFlight, setActionInFlight] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName,  setInviteLastName]  = useState('')
  const [inviteEmail,     setInviteEmail]     = useState('')
  const [inviting, setInviting] = useState(false)

  function showSuccess(text: string) {
    setStatusMessage({ kind: 'success', text })
    setTimeout(() => setStatusMessage(null), 4000)
  }

  function showError(text: string) {
    setStatusMessage({ kind: 'error', text })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  async function refreshList() {
    router.refresh()
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)

    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: inviteFirstName,
          lastName:  inviteLastName,
          email:     inviteEmail,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        showError(data?.error?.message || 'Could not send invite')
        setInviting(false)
        return
      }

      showSuccess(`Invite sent to ${inviteEmail}`)
      setInviteFirstName('')
      setInviteLastName('')
      setInviteEmail('')
      setShowInviteForm(false)
      refreshList()
    } catch {
      showError('Network error. Please try again.')
    } finally {
      setInviting(false)
    }
  }

  async function handleRevoke(teacher: Teacher) {
    if (!confirm(`Revoke ${teacher.firstName} ${teacher.lastName}'s access? They won't be able to log in until you reinstate them.`)) {
      return
    }

    setActionInFlight(teacher.id)
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/revoke`, {
        method: 'PATCH',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showError(data?.error?.message || 'Could not revoke teacher')
        return
      }

      showSuccess(`${teacher.firstName} ${teacher.lastName} has been revoked`)
      refreshList()
    } catch {
      showError('Network error. Please try again.')
    } finally {
      setActionInFlight(null)
    }
  }

  async function handleReinstate(teacher: Teacher) {
    setActionInFlight(teacher.id)
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/reinstate`, {
        method: 'PATCH',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showError(data?.error?.message || 'Could not reinstate teacher')
        return
      }

      showSuccess(`${teacher.firstName} ${teacher.lastName} has been reinstated`)
      refreshList()
    } catch {
      showError('Network error. Please try again.')
    } finally {
      setActionInFlight(null)
    }
  }

  async function handleResetPassword(teacher: Teacher) {
    if (!confirm(`Reset ${teacher.firstName}'s password? They'll receive an email with a link to set a new one. Their current password will stop working immediately.`)) {
      return
    }

    setActionInFlight(teacher.id)
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/reset-password`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showError(data?.error?.message || 'Could not reset password')
        return
      }

      showSuccess(`Password reset link sent to ${teacher.email}`)
      refreshList()
    } catch {
      showError('Network error. Please try again.')
    } finally {
      setActionInFlight(null)
    }
  }

  return (
    <>
      {/* Status messages */}
      {statusMessage && (
        <div
          className={[
            'mb-6 rounded-lg px-4 py-3 text-sm',
            statusMessage.kind === 'success'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-destructive/5 text-destructive border border-destructive/20',
          ].join(' ')}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Invite form */}
      <div className="mb-10 rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-xl font-medium tracking-tight">Invite a teacher</h2>
          {!showInviteForm && (
            <Button
              size="sm"
              onClick={() => setShowInviteForm(true)}
            >
              Invite teacher
            </Button>
          )}
        </div>

        {showInviteForm && (
          <form onSubmit={handleInvite} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                The teacher will receive an email with a link to set their own password.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={inviting}>
                {inviting ? 'Sending invite…' : 'Send invite'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowInviteForm(false)
                  setInviteFirstName('')
                  setInviteLastName('')
                  setInviteEmail('')
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Teacher list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="font-display text-lg font-medium tracking-tight">
            All teachers <span className="text-muted-foreground font-normal">({teachers.length})</span>
          </h2>
        </div>

        {teachers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No teachers yet. Invite your first one above.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {teachers.map((teacher) => (
              <TeacherRow
                key={teacher.id}
                teacher={teacher}
                inFlight={actionInFlight === teacher.id}
                onRevoke={() => handleRevoke(teacher)}
                onReinstate={() => handleReinstate(teacher)}
                onResetPassword={() => handleResetPassword(teacher)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function TeacherRow({
  teacher, inFlight,
  onRevoke, onReinstate, onResetPassword,
}: {
  teacher: Teacher
  inFlight: boolean
  onRevoke: () => void
  onReinstate: () => void
  onResetPassword: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="font-medium">
            {teacher.firstName} {teacher.lastName}
          </p>
          <StatusBadge status={teacher.status} />
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {teacher.email}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {teacher.status === 'ACTIVE' && (
          <>
            <Button
              size="sm"
              variant="ghost"
              disabled={inFlight}
              onClick={onResetPassword}
              className="text-xs"
            >
              Reset password
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={inFlight}
              onClick={onRevoke}
              className="text-xs text-destructive hover:bg-destructive/10"
            >
              Revoke
            </Button>
          </>
        )}
        {teacher.status === 'INVITED' && (
          <span className="text-xs text-muted-foreground">
            Awaiting acceptance
          </span>
        )}
        {teacher.status === 'REVOKED' && (
          <Button
            size="sm"
            variant="ghost"
            disabled={inFlight}
            onClick={onReinstate}
            className="text-xs text-primary hover:bg-primary/10"
          >
            Reinstate
          </Button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'ACTIVE' | 'INVITED' | 'REVOKED' }) {
  const config = {
    ACTIVE:  { label: 'Active',   class: 'bg-primary/10 text-primary' },
    INVITED: { label: 'Invited',  class: 'bg-amber-100 text-amber-800' },
    REVOKED: { label: 'Revoked',  class: 'bg-muted text-muted-foreground' },
  }[status]

  return (
    <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${config.class}`}>
      {config.label}
    </span>
  )
}
