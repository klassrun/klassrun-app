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
