// app/portal/[slug]/accept/[token]/page.tsx
// ops-5c-portal-accept-page
import { PortalAcceptClient } from './accept-client'

export const dynamic = 'force-dynamic'

export default async function PortalAcceptPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params
  return <PortalAcceptClient slug={slug} token={token} />
}
