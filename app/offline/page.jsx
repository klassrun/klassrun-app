'use client'

import Image from 'next/image'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-foreground px-6 text-center">
      <Image
        src="/images/logo.webp"
        alt="KlassRun"
        width={120}
        height={90}
        className="max-w-[120px] w-auto h-auto mb-6 opacity-60"
        unoptimized
      />
      <h1 className="text-xl font-bold text-foreground mb-2">
        You&apos;re offline
      </h1>
      <p className="text-sm text-muted-foreground max-w-[360px] leading-relaxed mb-8">
        Check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
