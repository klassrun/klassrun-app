// app/dashboard/settings/page.tsx
//
// School profile editor. SCHOOL_ADMIN only — middleware enforces this,
// and this page redirects defensively in case middleware was bypassed.

import { redirect } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth-cookie'
import { apiFetch } from '@/lib/api'
import { SettingsClient } from './settings-client'

type MeResponse = {
  user: {
    id: string
    email: string
    role: string
  }
}

type School = {
  id: string
  name: string
  slug: string
  status: string
  address: string | null
  state: string | null
  phone: string | null
  contactEmail: string | null
  motto: string | null
  rcNumber: string | null
  logoUrl: string | null
  createdAt: string
}

export default async function SettingsPage() {
  const token = await getAuthCookie()
  if (!token) redirect('/login')

  const meResult = await apiFetch<MeResponse>('/api/auth/me', { token })
  if (!meResult.ok || !meResult.data) redirect('/login')

  const role = meResult.data.user.role
  if (role === 'SUPER_ADMIN') redirect('/admin')
  if (role !== 'SCHOOL_ADMIN') redirect('/dashboard')

  const schoolResult = await apiFetch<{ school: School }>('/api/schools/me', { token })
  if (!schoolResult.ok || !schoolResult.data?.school) redirect('/dashboard')

  return <SettingsClient school={schoolResult.data.school} />
}
