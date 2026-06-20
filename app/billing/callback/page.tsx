// app/billing/callback/page.tsx
// gate2-callback-page
import { CallbackClient } from './_components/callback-client'

export const dynamic = 'force-dynamic'

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>
}) {
  const sp = await searchParams
  const reference = sp.reference || sp.trxref || ''
  return <CallbackClient reference={reference} />
}
