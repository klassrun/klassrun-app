// app/portal/[slug]/layout.tsx
// ops-5c-portal-layout
import Image from 'next/image'
import Link from 'next/link'
import { getPortalCookie } from '@/lib/auth-cookie'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const signedIn = !!(await getPortalCookie())

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href={`/portal/${slug}/dashboard`} className="inline-flex items-center gap-3">
            <Image src="/images/logo.webp" alt="Klassrun" width={32} height={32} className="h-8 w-auto" unoptimized />
            <span className="font-display text-base font-semibold tracking-tight">Klassrun</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">· Parent &amp; Student Portal</span>
          </Link>
          {signedIn && (
            <form action={`/api/portal/logout?next=/portal/${slug}/login`} method="post">
              <button
                type="submit"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-8">{children}</main>
    </div>
  )
}
