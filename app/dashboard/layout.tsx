// app/dashboard/layout.tsx
// entitlements-app-v1: one place above EVERY dashboard page for the two things a
// school must never discover by pressing Save: that it is read-only, or that
// this page's feature is not in its plan. Fetches once; if the call fails the
// bar simply does not render (the API gate still protects everything).

import type { ReactNode } from 'react'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import type { Entitlements } from '@/lib/entitlements'
import { GateBar } from './_components/gate-bar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const token = await getAuthCookie()
  let ent: Entitlements | null = null
  if (token) {
    const result = await apiFetch<Entitlements>('/api/billing/entitlements', { token })
    ent = result.ok ? (result.data ?? null) : null
  }
  return (
    <>
      {ent && ent.enforced ? <GateBar ent={ent} /> : null}
      {children}
    </>
  )
}
