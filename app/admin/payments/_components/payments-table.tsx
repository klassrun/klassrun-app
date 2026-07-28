// app/admin/payments/_components/payments-table.tsx
// b2b-payments-v1 - read-only view of the B1 payments ledger.
//
// Deliberately a SERVER component. B2's schools-table is 'use client' because
// it mutates (approve / suspend / extend); this one only reads, so there is
// nothing to hydrate. The practical win: rawEvent (the full Paystack event
// blob - payer email, card metadata, IP) never crosses to the browser, and
// never lands in the serialised RSC payload.

import { Fragment } from 'react'

export type AdminPayment = {
  id: string
  reference: string
  schoolId: string
  plan?: string | null
  amountKobo?: number | null
  currency?: string | null
  channel?: string | null
  source?: string | null
  paidAt?: string | null
  createdAt?: string | null
  note?: string | null
  school?: { id: string; name: string; slug: string } | null
}

// The ledger stores timestamps as `timestamp without time zone` (UTC). A Lagos
// operator reading a UTC clock as local time is a real misread, so the zone is
// pinned explicitly rather than left to the server's locale.
function lagosDateTime(value?: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Africa/Lagos',
    }).format(d)
  } catch {
    return d.toISOString().slice(0, 16).replace('T', ' ')
  }
}

function naira(kobo?: number | null): string {
  if (typeof kobo !== 'number' || !Number.isFinite(kobo)) return '-'
  return '₦' + (kobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function SourceBadge({ source }: { source?: string | null }) {
  const s = (source || '').toLowerCase()
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown'

  // webhook = the primary (and only) activator for transfer/USSD payers.
  // verify  = the backup activator fired instead - worth noticing.
  // manual  = a super-admin goodwill extension, not revenue.
  let cls = 'border-background/20 text-background/70'
  if (s === 'webhook') cls = 'border-background/25 bg-background/10 text-background/85'
  else if (s === 'verify') cls = 'border-amber-400/40 bg-amber-400/10 text-amber-300'
  else if (s === 'manual') cls = 'border-background/25 text-background/55'

  return (
    <span
      className={
        'inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ' +
        cls
      }
    >
      {label}
    </span>
  )
}

function AmountCell({ payment }: { payment: AdminPayment }) {
  const isManualGoodwill =
    (payment.source || '').toLowerCase() === 'manual' && (payment.amountKobo ?? 0) === 0

  // Currency is NGN by construction (the webhook rejects anything else as
  // terminal), so it is not a column. Anything else is an anomaly and is
  // flagged loudly instead of being buried in a column of identical values.
  const odd = payment.currency && payment.currency.toUpperCase() !== 'NGN'

  if (isManualGoodwill) {
    return <span className="text-background/40">-</span>
  }
  return (
    <span className="whitespace-nowrap tabular-nums">
      {naira(payment.amountKobo)}
      {odd ? (
        <span className="ml-2 rounded border border-red-400/50 px-1 text-[9px] uppercase tracking-wider text-red-300">
          {payment.currency}
        </span>
      ) : null}
    </span>
  )
}

export function PaymentsTable({
  payments,
  filtered,
}: {
  payments: AdminPayment[]
  filtered?: boolean
}) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-background/15 bg-background/5 px-6 py-12 text-center">
        <p className="text-sm font-medium text-background/80">
          {filtered ? 'No payments for this school yet.' : 'No payments recorded yet.'}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-background/50">
          The ledger is live. Every activation - webhook, verify, or a manual
          extension - books a row here from the moment it happens.
        </p>
      </div>
    )
  }

  const shownTotalKobo = payments
    .filter((p) => (p.source || '').toLowerCase() !== 'manual')
    .reduce((sum, p) => sum + (typeof p.amountKobo === 'number' ? p.amountKobo : 0), 0)

  return (
    <div className="overflow-hidden rounded-xl border border-background/15">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-background/15 bg-background/5 text-[11px] uppercase tracking-[0.14em] text-background/50">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">School</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <Fragment key={p.id}>
                <tr className="border-b border-background/10 last:border-b-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-background/80">
                    {lagosDateTime(p.paidAt ?? p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-background">
                      {p.school?.name ?? 'Unknown school'}
                    </span>
                    <span className="block font-mono text-[11px] text-background/45">
                      {p.school?.slug ?? p.schoolId.slice(0, 8)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-background/75">
                    {p.plan ? p.plan.toUpperCase() : '-'}
                  </td>
                  <td className="px-4 py-3 text-background/85">
                    <AmountCell payment={p} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-background/60">
                    {p.channel ? p.channel.toLowerCase() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={p.source} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-background/70">
                    {p.reference}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-xs leading-relaxed text-background/55">
                    {p.note ? p.note : '-'}
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-background/15 bg-background/5 px-4 py-3 text-xs text-background/55">
        <span>
          {payments.length} payment{payments.length === 1 ? '' : 's'} shown
        </span>
        <span className="tabular-nums">
          {naira(shownTotalKobo)} shown on this page
          <span className="ml-1 text-background/35">(excludes manual extensions)</span>
        </span>
      </div>
    </div>
  )
}
