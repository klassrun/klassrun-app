#!/bin/bash

# ============================================================
# KlassRun App Setup Script
# Converts a copy of klassrun-web into klassrun-app
# 
# USAGE:
# 1. Manually copy klassrun-web folder to klassrun-app
# 2. Open Git Bash in the klassrun-app folder
# 3. Run: bash setup-app.sh
# ============================================================

echo ""
echo "🚀 Setting up klassrun-app from klassrun-web..."
echo "================================================"
echo ""

# ── Step 1: Remove old git history ──
echo "1. Removing old git history..."
rm -rf .git
echo "   ✓ Old .git removed"

# ── Step 2: Remove landing page components ──
echo ""
echo "2. Removing landing page components..."
rm -f components/Hero.jsx
rm -f components/CredStrip.jsx
rm -f components/About.jsx
rm -f components/Product.jsx
rm -f components/HowItWorks.jsx
rm -f components/Pricing.jsx
rm -f components/CTA.jsx
rm -f components/Footer.jsx
rm -f components/Navbar.jsx
echo "   ✓ Landing page components removed"

# ── Step 3: Remove landing page ──
echo ""
echo "3. Removing landing page files..."
rm -f app/page.jsx
echo "   ✓ Landing page removed"

# ── Step 4: Remove .next build cache ──
echo ""
echo "4. Removing build cache..."
rm -rf .next
echo "   ✓ Build cache removed"

# ── Step 5: Update package.json ──
echo ""
echo "5. Updating package.json..."
if command -v node &> /dev/null; then
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.name = 'klassrun-app';
    pkg.version = '0.1.0';
    pkg.description = 'KlassRun - AI Lesson Note & School Management Platform';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log('   ✓ package.json updated');
  "
else
  echo "   ⚠ Node.js not found, skipping package.json update. Manually change name to klassrun-app"
fi

# ── Step 6: Update manifest.js ──
echo ""
echo "6. Updating PWA manifest..."
cat > app/manifest.js << 'EOF'
export default function manifest() {
  return {
    name: 'KlassRun - School Management Platform',
    short_name: 'KlassRun',
    description:
      'AI-powered lesson notes, exam questions, and school management for Nigerian schools.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3DB54A',
    orientation: 'portrait',
    scope: '/',
    lang: 'en',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['education', 'productivity', 'business'],
  }
}
EOF
echo "   ✓ manifest.js updated"

# ── Step 7: Update layout.jsx ──
echo ""
echo "7. Updating layout.jsx..."
cat > app/layout.jsx << 'LAYOUT'
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
LAYOUT
echo "   ✓ layout.jsx updated"

# ── Step 8: Create placeholder app page ──
echo ""
echo "8. Creating placeholder app page..."
cat > app/page.jsx << 'PAGE'
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
PAGE
echo "   ✓ Placeholder page created"

# ── Step 9: Update robots.js ──
echo ""
echo "9. Updating robots.js..."
cat > app/robots.js << 'ROBOTS'
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
    ],
    sitemap: 'https://app.klassrun.com/sitemap.xml',
  }
}
ROBOTS
echo "   ✓ robots.js updated"

# ── Step 10: Update sitemap.js ──
echo ""
echo "10. Updating sitemap.js..."
cat > app/sitemap.js << 'SITEMAP'
export default function sitemap() {
  const baseUrl = 'https://app.klassrun.com'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ]
}
SITEMAP
echo "   ✓ sitemap.js updated"

# ── Step 11: Update service worker ──
echo ""
echo "11. Updating service worker..."
cat > public/sw.js << 'SW'
const CACHE_NAME = 'klassrun-app-v1'

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/images/logo.webp',
  '/images/logo-nav.webp',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const { destination } = event.request

  if (destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/offline')
          })
        })
    )
    return
  }

  if (['image', 'script', 'style', 'font'].includes(destination)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
      })
    )
    return
  }
})
SW
echo "   ✓ Service worker updated"

# ── Step 12: Create app route groups ──
echo ""
echo "12. Creating app route structure..."
mkdir -p app/\(auth\)/login
mkdir -p app/\(auth\)/signup
mkdir -p app/\(dashboard\)
mkdir -p app/offline

# Auth login placeholder
cat > app/\(auth\)/login/page.jsx << 'LOGIN'
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-border bg-card">
        <h1 className="text-2xl font-bold text-foreground text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Sign in to your KlassRun account
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Login form coming soon...
        </p>
      </div>
    </div>
  )
}
LOGIN

# Auth signup placeholder
cat > app/\(auth\)/signup/page.jsx << 'SIGNUP'
export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-border bg-card">
        <h1 className="text-2xl font-bold text-foreground text-center mb-2">
          Get Started
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Create your school account on KlassRun
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Signup form coming soon...
        </p>
      </div>
    </div>
  )
}
SIGNUP

# Dashboard placeholder
cat > app/\(dashboard\)/page.jsx << 'DASH'
export default function DashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}
DASH

# Offline page
cat > app/offline/page.jsx << 'OFFLINE'
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
OFFLINE

echo "   ✓ Route structure created"
echo "     - app/(auth)/login/page.jsx"
echo "     - app/(auth)/signup/page.jsx"
echo "     - app/(dashboard)/page.jsx"
echo "     - app/offline/page.jsx"

# ── Step 13: Initialize new git repo ──
echo ""
echo "13. Initializing new git repo..."
git init
git add .
git commit -m "init: klassrun-app scaffolded from klassrun-web

- Stripped landing page components (Hero, About, Pricing, etc.)
- Kept PWA setup (manifest, service worker, offline page, loading splash)
- Kept shadcn/ui + Tailwind v4 + Klassrun brand colors
- Updated metadata for app.klassrun.com
- Created route structure: (auth)/login, (auth)/signup, (dashboard)
- Added coming soon placeholder page"

echo ""
echo "================================================"
echo "✅ klassrun-app is ready!"
echo ""
echo "Next steps:"
echo "  1. Create a new repo on GitHub called 'klassrun-app'"
echo "  2. Run: git remote add origin https://github.com/YOUR_USERNAME/klassrun-app.git"
echo "  3. Run: git push -u origin main"
echo "  4. Connect to Vercel and set domain to app.klassrun.com"
echo "  5. Start building auth, dashboard, and AI endpoints"
echo "================================================"
