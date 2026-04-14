import './globals.css'
import LoadingSplash from '@/components/LoadingSplash'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const BASE_URL = 'https://app.klassrun.com'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3DB54A',
  colorScheme: 'light',
}

export const metadata = {
  title: {
    default: 'KlassRun — AI Lesson Notes & School Management',
    template: '%s | KlassRun',
  },
  description:
    'Generate curriculum-aligned lesson notes, WAEC/NECO exam questions, and manage your school — all in one platform.',
  keywords: [
    'lesson note generator',
    'WAEC exam questions',
    'school management Nigeria',
    'AI lesson notes',
    'NERDC curriculum',
    'KlassRun',
  ],
  authors: [{ name: 'Klassrun Technologies Ltd' }],

  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: BASE_URL,
    siteName: 'KlassRun',
    title: 'KlassRun — AI Lesson Notes & School Management',
    description:
      'Generate curriculum-aligned lesson notes, WAEC/NECO exam questions, and manage your school.',
    images: [
      {
        url: `${BASE_URL}/images/og-image.webp`,
        width: 1200,
        height: 630,
        alt: 'KlassRun Platform',
        type: 'image/webp',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'KlassRun',
    description: 'AI-powered lesson notes and school management for Nigerian schools.',
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

  alternates: {
    canonical: BASE_URL,
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LoadingSplash />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
