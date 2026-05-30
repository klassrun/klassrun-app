# Klassrun App

> The school portal for **Klassrun** — where principals and teachers actually use the product.

This is the Next.js application served at `app.klassrun.com`. It contains the signup flow, login, school admin dashboard, teacher dashboard, classes management, AI lesson notes, AI schemes of work, and (in upcoming phases) exam questions, parent portal, results, and attendance.

The app talks to **klassrun-api** (Express + Postgres on Render) over REST. Authentication uses **httpOnly cookies** for security against XSS.

---

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Quick start (local dev)](#quick-start-local-dev)
- [Environment variables](#environment-variables)
- [Authentication model](#authentication-model)
- [Route guard (`proxy.ts`)](#route-guard-proxyts)
- [Routes](#routes)
- [Talking to klassrun-api](#talking-to-klassrun-api)
- [Conventions](#conventions)
- [Deployment](#deployment)
- [License](#license)

---

## Architecture

```
Browser (user)
   │
   ▼
app.klassrun.com  ── Vercel
   │
   │  /api/*               ← Route Handlers (this app)
   │     │
   │     ▼                 cross-origin REST + Bearer JWT
   └──────────────► klassrun-api.onrender.com  ── Render
                       │
                       ▼
                    PostgreSQL (Neon)
```

The user's browser **never** talks to klassrun-api directly. Every API call goes through this app's own Route Handlers, which:

1. Read the JWT from the httpOnly `klassrun_auth` cookie
2. Forward to klassrun-api with `Authorization: Bearer <jwt>`
3. Return the response to the browser

This keeps the JWT inaccessible to client-side JavaScript.

---

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack, Server Components, Route Handlers)
- **UI:** React 19, shadcn/ui, Tailwind CSS v4
- **Math rendering:** KaTeX (`katex` + `@types/katex`) — CSS imported globally in `app/layout.jsx`
- **Toasts:** sonner
- **Calendar:** react-day-picker v10 + date-fns v4
- **Forms:** React state (no form library — small forms, fewer deps)
- **Auth storage:** httpOnly cookies via Next.js cookies API
- **Hosting:** Vercel (full Next.js with Route Handlers, not static export)

---

## Project structure

```
klassrun-app/
├── app/
│   ├── layout.jsx              # Root layout (.jsx, not .tsx), metadata, fonts, KaTeX CSS
│   ├── globals.css             # Tailwind + brand tokens
│   ├── page.tsx                # Public splash
│   ├── manifest.js             # PWA manifest
│   ├── robots.js               # /robots.txt
│   ├── sitemap.js              # /sitemap.xml
│   │
│   ├── (auth)/                 # Route group
│   │   ├── login/
│   │   └── signup/
│   │
│   ├── accept-invite/          # Teacher invite acceptance flow
│   ├── forgot-password/
│   ├── reset-password/
│   │
│   ├── dashboard/
│   │   ├── page.tsx            # Routes by role: TeacherDashboard or AdminDashboard
│   │   ├── _components/
│   │   │   ├── admin-dashboard.tsx     # Admin shell — sidebar nav lives INLINE here
│   │   │   ├── teacher-dashboard.tsx   # Teacher shell + "AI" cards
│   │   │   └── teacher-picker.tsx
│   │   ├── academic/           # Sessions & terms (admin)
│   │   ├── classes/            # Classes CRUD (admin)
│   │   ├── teachers/           # Invite/manage teachers (admin)
│   │   ├── settings/           # School profile + logo (admin)
│   │   ├── lessons/            # AI lesson notes (teacher generates, admin views)
│   │   │   ├── new/
│   │   │   ├── [id]/
│   │   │   └── _components/
│   │   │       ├── lesson-note-render.tsx
│   │   │       └── math-text.tsx       # KaTeX render — takes `text` prop, NOT children
│   │   └── schemes/            # AI schemes of work (Phase 3.2)
│   │       ├── new/
│   │       ├── [id]/
│   │       └── _components/scheme-render.tsx
│   │
│   ├── admin/                  # SUPER_ADMIN console
│   │
│   ├── offline/                # PWA offline fallback
│   │
│   └── api/                    # Route Handlers (server-side proxies)
│       ├── auth/               # signup, login, logout, me, accept-invite, etc.
│       ├── slug/               # check, suggest, generate (public)
│       ├── schools/            # /me, settings, logo upload sign
│       ├── sessions/, classes/, subjects/, teachers/
│       ├── notes/              # Lesson notes proxy
│       └── schemes/            # Schemes of work proxy
│
├── components/
│   ├── LoadingSplash.jsx
│   ├── ServiceWorkerRegister.jsx
│   └── ui/                     # shadcn primitives (button, input, label, card, dialog, ...)
│
├── lib/
│   ├── api.ts                  # apiFetch<T>(path, opts) — returns ApiResponse<T>, NEVER throws
│   ├── auth-cookie.ts          # getAuthCookie(), AUTH_COOKIE_NAME='klassrun_auth', ROLE_COOKIE_NAME
│   ├── states.ts               # Nigerian states + FCT
│   └── utils.ts                # cn() etc.
│
├── public/                     # Static assets, logos, manifest icons
│
├── proxy.ts                    # Route guard (was middleware.ts before Phase 4b)
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Quick start (local dev)

### Prerequisites

- Node 20+, npm 10+
- klassrun-api running on `http://localhost:4000` (see `klassrun-api/README.md`)

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Default values point at local API on port 4000:

```bash
KLASSRUN_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start

```bash
npm run dev
```

Open http://localhost:3000.

---

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `KLASSRUN_API_URL` | ✅ | `http://localhost:4000` | URL of klassrun-api. **Server-only.** |
| `NEXT_PUBLIC_APP_URL` | | `http://localhost:3000` | This app's public URL. Used in metadata. |

> `KLASSRUN_API_URL` is **server-only** — it doesn't ship to the client bundle. The browser never knows the API URL directly because all calls go through Route Handlers.

---

## Authentication model

### How the cookie flows

1. User submits signup or login form
2. Form posts to `/api/auth/{signup|login}` (a Route Handler in this app)
3. Route Handler calls klassrun-api with the user's credentials
4. On success, klassrun-api returns a JWT
5. Route Handler stores the JWT in an httpOnly cookie named **`klassrun_auth`**
6. Route Handler returns user info **without the token** — client never sees it
7. Browser redirects to `/dashboard`

### Two cookies

| Cookie | httpOnly | Purpose |
|---|---|---|
| `klassrun_auth` | ✅ | The JWT itself. Read by Route Handlers via `getAuthCookie()`. Never accessible to client JS. |
| `klassrun_role` | ❌ | The user's role (`SCHOOL_ADMIN`, `TEACHER`, `SUPER_ADMIN`). Used by `proxy.ts` for fast UI routing — **not** security. The API does real role checks on every request. |

### Cookie attributes (auth)

```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,   // 1 week
}
```

### Logout

`POST /api/auth/logout` clears both cookies. The dashboard's "Sign out" button is a `<form>` posting to that endpoint — no client-side JS needed.

---

## Route guard (`proxy.ts`)

The route guard file is **`proxy.ts`**, NOT `middleware.ts`. It was renamed in Phase 4b to clear a Next.js 16 deprecation. The exported function is `export function proxy(...)`, not `middleware`.

What it does:

- If `klassrun_auth` is missing and route is protected (`/dashboard/*`, `/admin/*`) → redirect to `/login?next=<path>`
- If `klassrun_auth` is present and route is `/login` or `/signup` → redirect to `/dashboard`
- Uses `klassrun_role` to route SUPER_ADMIN to `/admin` and prevent non-admins from hitting `/admin`

Server pages that show per-user mutable data should also include:

```typescript
export const dynamic = 'force-dynamic'
```

…because Next 16's Router Cache otherwise serves stale output after `router.refresh()`. Applied to every server page in `dashboard/lessons` and `dashboard/schemes`.

---

## Routes

| Path | Auth | Description |
|---|---|---|
| `/` | Public | Splash. Redirects to `/dashboard` if logged in. |
| `/login` | Public | Login form. Redirects to `/dashboard` if already logged in. |
| `/signup` | Public | School signup with live slug picker. |
| `/forgot-password`, `/reset-password` | Public | Password reset flow. |
| `/accept-invite/[token]` | Public | Teacher accepts an invite from their email. |
| `/dashboard` | Required | Routes by role. Admin sees `AdminDashboard`; teacher sees `TeacherDashboard`. |
| `/dashboard/academic` | SCHOOL_ADMIN | Sessions & terms management |
| `/dashboard/classes` | SCHOOL_ADMIN | Classes CRUD + archive |
| `/dashboard/classes/[id]` | SCHOOL_ADMIN | Class detail — subjects live INSIDE the parent class |
| `/dashboard/teachers` | SCHOOL_ADMIN | Invite/revoke teachers, assign to subjects |
| `/dashboard/settings` | SCHOOL_ADMIN | School profile, motto, logo upload |
| `/dashboard/lessons` | TEACHER, SCHOOL_ADMIN | List lesson notes |
| `/dashboard/lessons/new` | TEACHER | Generate a lesson note |
| `/dashboard/lessons/[id]` | TEACHER, SCHOOL_ADMIN | View/edit lesson note |
| `/dashboard/schemes` | TEACHER, SCHOOL_ADMIN | List schemes of work |
| `/dashboard/schemes/new` | TEACHER | Generate a 12-week scheme. Admins are redirected to the list. |
| `/dashboard/schemes/[id]` | TEACHER, SCHOOL_ADMIN | View scheme of work |
| `/admin` | SUPER_ADMIN | Platform console |
| `/api/*` | Mostly cookie-required | Route Handlers proxying to klassrun-api |

---

## Talking to klassrun-api

### Reading the cookie

**Always** use `getAuthCookie()` from `@/lib/auth-cookie`:

```typescript
import { getAuthCookie } from '@/lib/auth-cookie'

const token = await getAuthCookie()
if (!token) {
  return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 })
}
```

Do **not** call `cookies().get('klassrun_token')` — that cookie name doesn't exist. (Phase 3.2 hotfix: every scheme page used the wrong cookie name and silently 401'd. Always use the helper.)

### Server-side fetch

For most calls, use `apiFetch<T>` from `@/lib/api`:

```typescript
import { apiFetch } from '@/lib/api'

const result = await apiFetch<{ assignments: Assignment[] }>(
  '/api/teachers/me/assignments',
  { token }
)

if (!result.ok) {
  // result.error is { message: string, field?: string }
  return <ErrorState message={result.error?.message} />
}

const assignments = result.data?.assignments ?? []
```

**`apiFetch` returns `ApiResponse<T>` and never throws.** Check `result.ok`. Do not wrap in try/catch — there's nothing to catch.

### Forms in client components

When a client component receives server-fetched data as a prop AND calls `router.refresh()` after mutations, sync the prop into state with `useEffect`:

```typescript
const [items, setItems] = useState(initialItems)
useEffect(() => { setItems(initialItems) }, [initialItems])
```

Without this, `useState`'s first-call lock drops subsequent prop refreshes silently.

---

## Conventions

### File naming

- `.tsx` for components and pages with TypeScript
- `.jsx` only for `app/layout.jsx` (kept as `.jsx` historically)
- Route Handlers always `route.ts`

### Server vs client components

- Default to server components
- Mark `'use client'` only when you need state, effects, or browser APIs
- Auth flows are client (form state + redirect)
- Most dashboards are server components (cleaner data fetching)

### Imports

```typescript
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { getAuthCookie } from '@/lib/auth-cookie'
```

The `@/` alias maps to the project root.

### Math text

For any user-visible text that may contain LaTeX (lesson notes, schemes — anything AI-generated):

```typescript
import { MathText } from '@/app/dashboard/lessons/_components/math-text'

<MathText text={someString} />   // ✓ — takes `text` prop
<MathText>{someString}</MathText>  // ✗ — does NOT take children
```

### Sidebar navigation

The school admin sidebar lives INLINE in `app/dashboard/_components/admin-dashboard.tsx`. It's not a standalone component. When adding a top-level nav entry, edit the `<nav>` block inside `AdminDashboard`.

The teacher dashboard has no sidebar — teachers navigate from the dashboard's "Get started" / cards section in `teacher-dashboard.tsx`.

---

## Deployment

Production: **Vercel** (Hobby plan). Auto-deploys from the `main` branch on GitHub push. Build takes ~2 minutes.

Environment variables are set in Vercel project settings:

- **Production:**
  - `KLASSRUN_API_URL=https://klassrun-api.onrender.com`
  - `NEXT_PUBLIC_APP_URL=https://app.klassrun.com`
- **Preview:** same values (or staging URLs if/when staging exists)

The app is configured for **full Next.js with Route Handlers**, not static export. Static export would break Route Handlers and `proxy.ts`, which we rely on for authentication and role routing.

---

## License

UNLICENSED — © Klassrun Technologies Ltd. All rights reserved.

---

## Contact

- **Website:** [klassrun.com](https://klassrun.com)
- **Email:** info@klassrun.com
- **Company:** Klassrun Technologies Ltd · RC 9463863 · Lagos, Nigeria
