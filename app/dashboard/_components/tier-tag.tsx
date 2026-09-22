// app/dashboard/_components/tier-tag.tsx
// entitlements-app-v1: a small "Standard" / "Premium" tag beside a menu item the
// school's plan does not include. Renders nothing when the feature is included.

export function TierTag({ tier }: { tier?: string }) {
  if (!tier) return null
  return (
    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-800">
      {tier}
    </span>
  )
}
