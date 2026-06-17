// app/portal/[slug]/login/page.tsx
// ops-5c-portal-login-page
import { redirect } from 'next/navigation'
import { getPortalCookie } from '@/lib/auth-cookie'
import { PortalLoginClient } from './login-client'

export const dynamic = 'force-dynamic'

export default async function PortalLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (await getPortalCookie()) redirect(`/portal/${slug}/dashboard`)
  return <PortalLoginClient slug={slug} />
}
