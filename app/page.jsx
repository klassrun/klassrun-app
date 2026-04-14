import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <Image
        src="/images/logo.webp"
        alt="KlassRun"
        width={160}
        height={120}
        className="max-w-[160px] w-auto h-auto mb-8"
        unoptimized
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
        KlassRun is Coming Soon
      </h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md leading-relaxed">
        AI-powered lesson notes, exam questions, and school management — built
        for Nigerian schools.
      </p>
      <a
        href="https://klassrun.com"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Back to Klassrun.com
      </a>
    </div>
  )
}
