// app/dashboard/schemes/_components/aligned-note-button.tsx
// batch-4b-aligned-note-button
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AlignedNoteButton({ schemeId, week, topic }: { schemeId: string; week: number; topic: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    if (!topic || !topic.trim()) { setError('Add a topic to this week first.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/notes/generate-aligned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadedSchemeId: schemeId, week }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error?.message || `Failed (${res.status}).`); setBusy(false); return; }
      router.push(`/dashboard/lessons/${body.note.id}`);
    } catch (err: any) {
      setError(err?.message || 'Network error');
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-60"
      >
        {busy ? 'Generating aligned note…' : 'Generate aligned lesson note'}
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default AlignedNoteButton;
