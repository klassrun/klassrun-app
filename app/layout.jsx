import './globals.css'
import { Fraunces, Geist } from 'next/font/google'
import LoadingSplash from '@/components/LoadingSplash'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const BASE_URL = 'https://app.klassrun.com'

// ── Fonts ─────────────────────────────────────────────────────────────
//
// Fraunces — characterful serif for display/headings. Adds weight and
// editorial gravitas. Variable font, all weights/optical-sizes available.
//
// Geist — clean modern sans for body. Designed for screens, generous
// x-height, neutral but not boring.
//
// Both are exposed as CSS variables via next/font, then mapped in globals.css.

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3DB54A',
  colorScheme: 'light',
}

export const metadata = {
  title: {
    default: 'Klassrun — The School Operating System for Nigerian Schools',
    template: '%s · Klassrun',
  },
  description:
    'Run your school\'s academics from one place. AI-powered lesson notes, schemes of work, and WAEC/NECO-style exam preparation — built for the Nigerian curriculum.',
  keywords: [
    'school operating system',
    'school management Nigeria',
    'AI lesson notes',
    'WAEC exam questions',
    'NECO exam preparation',
    'NERDC curriculum',
    'school SaaS Nigeria',
    'Klassrun',
  ],
  authors: [{ name: 'Klassrun Technologies Ltd' }],

  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: BASE_URL,
    siteName: 'Klassrun',
    title: 'Klassrun — The School Operating System for Nigerian Schools',
    description:
      'Run your school\'s academics from one place. AI-powered lesson notes, schemes of work, and WAEC/NECO-style exam preparation.',
    images: [
      {
        url: `${BASE_URL}/images/og-image.webp`,
        width: 1200,
        height: 630,
        alt: 'Klassrun — School Operating System',
        type: 'image/webp',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Klassrun',
    description: 'The AI-powered school operating system for Nigerian schools.',
    images: [`${BASE_URL}/images/og-image.webp`],
  },

  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  alternates: { canonical: BASE_URL },
  robots:     { index: true, follow: true },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable}`}>
      <body className="antialiased">
        <LoadingSplash />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
