'use client'

// app/dashboard/settings/settings-client.tsx
//
// School profile editor form. SCHOOL_ADMIN only.
// PATCH-es /api/schools/me on save.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { STATES } from '@/lib/states'

type School = {
  id: string
  name: string
  slug: string
  status: string
  address: string | null
  state: string | null
  phone: string | null
  contactEmail: string | null
  motto: string | null
  rcNumber: string | null
  admissionPrefix?: string | null // fix3-admission-v1
  logoUrl: string | null
  createdAt: string
}

const MOTTO_MAX = 200

export function SettingsClient({ school }: { school: School }) {
  const router = useRouter()

  const [name, setName]                 = useState(school.name)
  const [stateField, setStateField]     = useState(school.state ?? 'Lagos')
  const [address, setAddress]           = useState(school.address ?? '')
  const [phone, setPhone]               = useState(school.phone ?? '')
  const [contactEmail, setContactEmail] = useState(school.contactEmail ?? '')
  const [motto, setMotto]               = useState(school.motto ?? '')
  const [rcNumber, setRcNumber]         = useState(school.rcNumber ?? '')
  const [admissionPrefix, setAdmissionPrefix] = useState(school.admissionPrefix ?? '') // fix3-admission-v1

  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/schools/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          state: stateField,
          address: address.trim() || null,
          phone: phone.trim() || null,
          contactEmail: contactEmail.trim() || null,
          motto: motto.trim() || null,
          rcNumber: rcNumber.trim() || null,
          admissionPrefix: admissionPrefix.trim() || null, // fix3-admission-v1
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not save changes')
        setSubmitting(false)
        return
      }

      toast.success('Saved')
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // batch-2b-logo-upload
  async function saveLogo(logoUrl: string | null) {
    try {
      const res = await fetch('/api/schools/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Could not save logo')
        return
      }
      toast.success(logoUrl ? 'Logo saved' : 'Logo removed')
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8 lg:py-16">
        <div className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Settings
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            School profile
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Update the information teachers, parents, and inspectors see about your school.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* batch-2b-logo-upload */}
          <Section title="Logo">
            <LogoUpload
              currentLogoUrl={school.logoUrl}
              onUploaded={(url) => saveLogo(url)}
              onRemoved={() => saveLogo(null)}
            />
          </Section>

          <Section title="Basics">
            <Field label="School name" required>
              <input
                type="text" value={name} required
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
              <Field label="State">
                <select
                  value={stateField}
                  onChange={(e) => setStateField(e.target.value)}
                  className={inputClass}
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>

              <Field label="Address">
                <input
                  type="text" value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section title="Contact">
            <Field label="Phone">
              <input
                type="tel" value={phone} placeholder="+234 800 000 0000"
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Contact email" hint="Public email shown to parents and prospective students">
              <input
                type="email" value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Identity">
            <Field
              label="Motto"
              hint={`${motto.length}/${MOTTO_MAX} characters`}
            >
              <input
                type="text" value={motto}
                maxLength={MOTTO_MAX}
                onChange={(e) => setMotto(e.target.value)}
                className={inputClass}
                placeholder="Excellence in learning"
              />
            </Field>

            <Field label="RC number" hint="Nigerian company registration number (optional)">
              <input
                type="text" value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                className={inputClass + ' font-mono text-sm'}
              />
            </Field>

            {/* fix3-admission-v1 */}
            <Field
              label="Admission number prefix"
              hint="2-6 letters/digits, e.g. GIC. Used when auto-generating admission numbers (GIC/2026/001). Leave blank to use your school's initials."
            >
              <input
                type="text" value={admissionPrefix}
                maxLength={6}
                onChange={(e) => setAdmissionPrefix(e.target.value.toUpperCase())}
                className={inputClass + ' font-mono text-sm'}
                placeholder="GIC"
              />
            </Field>
          </Section>

          <Section title="Read-only">
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
              <ReadOnlyRow label="Portal" value={`${school.slug}.klassrun.com`} mono />
              <ReadOnlyRow label="Status" value={school.status === 'ACTIVE' ? 'Active' : 'Setting up'} />
              <ReadOnlyRow
                label="Created"
                value={new Date(school.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Need to change your portal address? Contact{' '}
              <a href="mailto:info@klassrun.com" className="font-medium text-foreground hover:text-primary">
                info@klassrun.com
              </a>
              .
            </p>
          </Section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || name.trim() === ''}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({
  label, required, hint, children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ReadOnlyRow({
  label, value, mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={[mono ? 'font-mono' : 'font-medium', 'text-right'].join(' ')}>
        {value}
      </span>
    </div>
  )
}

// batch-2b-logo-upload
function LogoUpload({
  currentLogoUrl,
  onUploaded,
  onRemoved,
}: {
  currentLogoUrl: string | null
  onUploaded: (url: string) => void
  onRemoved: () => void
}) {
  type Phase = 'idle' | 'validating' | 'signing' | 'uploading' | 'saving'
  const [phase, setPhase] = useState<Phase>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_BYTES = 2 * 1024 * 1024
  const busy = phase !== 'idle'
  const busyLabel: Record<Phase, string> = {
    idle: '',
    validating: 'Checking file…',
    signing: 'Preparing upload…',
    uploading: 'Uploading…',
    saving: 'Saving…',
  }

  function openPicker() {
    fileInputRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setPhase('validating')
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      setPhase('idle')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 2MB or less')
      setPhase('idle')
      return
    }

    try {
      setPhase('signing')
      const sigRes = await fetch('/api/schools/me/logo-upload-signature', { method: 'POST' })
      if (!sigRes.ok) {
        const data = await sigRes.json().catch(() => ({}))
        throw new Error(data?.error?.message ?? 'Could not prepare upload')
      }
      const sig = await sigRes.json()

      setPhase('uploading')
      const form = new FormData()
      form.append('file', file)
      form.append('api_key', sig.apiKey)
      form.append('timestamp', String(sig.timestamp))
      form.append('signature', sig.signature)
      form.append('upload_preset', sig.preset)
      form.append('folder', sig.folder)
      form.append('public_id', sig.publicId)

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: 'POST', body: form },
      )
      if (!uploadRes.ok) throw new Error('Upload failed. Please try again.')
      const uploadData = await uploadRes.json()
      const secureUrl: string = uploadData.secure_url
      if (!secureUrl) throw new Error('Upload failed. Please try again.')

      setPhase('saving')
      onUploaded(secureUrl)
      setPhase('idle')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setPhase('idle')
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {currentLogoUrl ? (
        <div className="flex items-center gap-4">
          <img
            src={currentLogoUrl.replace('/upload/', '/upload/w_160,h_160,c_fill,q_auto,f_auto/')}
            alt="Current school logo"
            className="h-20 w-20 rounded-lg border border-border object-cover"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openPicker}
              disabled={busy}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? busyLabel[phase] : 'Replace'}
            </button>
            <button
              type="button"
              onClick={onRemoved}
              disabled={busy}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
            No logo
          </div>
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? busyLabel[phase] : 'Upload logo'}
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        PNG, JPG, or WebP. 2 MB max. Square images look best.
      </p>
    </div>
  )
}
