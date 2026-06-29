// app/dashboard/schemes/_components/scheme-edit-weeks.tsx
// batch-4b-edit-weeks
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Week = {
  weekNumber: number;
  topic: string;
  objectives?: string[];
  activities?: string[];
  assessment?: string;
  resources?: string[];
};

type SchemeContent = {
  title?: string;
  subject?: string;
  class?: string;
  term?: string;
  overview?: string;
  weeks?: Week[];
  _metadata?: any;
  [k: string]: any;
};

export function SchemeEditWeeks({ schemeId, content }: { schemeId: string; content: SchemeContent }) {
  const router = useRouter();
  const [weeks, setWeeks] = useState<Week[]>(
    Array.isArray(content.weeks) ? content.weeks.map((w) => ({ ...w })) : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(i: number, patch: Partial<Week>) {
    setWeeks((prev) => prev.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
    setSaved(false);
  }
  function addWeek() {
    setWeeks((prev) => {
      const nextNum = prev.length > 0 ? Math.max(...prev.map((w) => w.weekNumber)) + 1 : 1;
      return [...prev, { weekNumber: nextNum, topic: '', objectives: [], activities: [], assessment: '', resources: [] }];
    });
    setSaved(false);
  }
  function removeWeek(i: number) {
    setWeeks((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  async function save() {
    setError(null);
    // basic guard: every week needs a topic
    for (const w of weeks) {
      if (!w.topic || !w.topic.trim()) { setError(`Week ${w.weekNumber} needs a topic.`); return; }
    }
    setSaving(true);
    try {
      const nextContent = { ...content, weeks };
      const res = await fetch(`/api/schemes/${schemeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: nextContent }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error?.message || `Save failed (${res.status}).`); setSaving(false); return; }
      setSaved(true);
      setSaving(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Network error');
      setSaving(false);
    }
  }

  const toLines = (arr?: string[]) => (Array.isArray(arr) ? arr.join('\n') : '');
  const fromLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

  return (
    <section className="mt-8 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Review &amp; edit parsed weeks</h2>
        <button
          type="button"
          onClick={addWeek}
          className="text-xs text-primary hover:underline"
        >
          + Add week
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Parsing is best-effort — please check each week against your original document and fix anything before generating notes.
      </p>

      <div className="space-y-4">
        {weeks.map((w, i) => (
          <div key={i} className="rounded-md border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Week</span>
              <input
                type="number"
                min={1}
                max={20}
                value={w.weekNumber}
                onChange={(e) => update(i, { weekNumber: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
                className="w-16 rounded-md border px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => removeWeek(i)}
                className="ml-auto rounded-md border px-2 py-1 text-xs hover:bg-accent"
              >
                Remove
              </button>
            </div>
            <label className="block text-xs font-medium mb-1">Topic</label>
            <input
              type="text"
              value={w.topic}
              onChange={(e) => update(i, { topic: e.target.value })}
              placeholder="Week topic"
              className="w-full rounded-md border px-3 py-2 text-sm mb-2"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Objectives (one per line)</label>
                <textarea
                  rows={3}
                  value={toLines(w.objectives)}
                  onChange={(e) => update(i, { objectives: fromLines(e.target.value) })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Activities (one per line)</label>
                <textarea
                  rows={3}
                  value={toLines(w.activities)}
                  onChange={(e) => update(i, { activities: fromLines(e.target.value) })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Assessment</label>
                <input
                  type="text"
                  value={w.assessment || ''}
                  onChange={(e) => update(i, { assessment: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
        {weeks.length === 0 && (
          <p className="text-sm text-muted-foreground">No weeks yet. Add one to start entering your scheme by hand.</p>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save weeks'}
        </button>
        {saved && <span className="text-xs text-primary">Saved ✓</span>}
      </div>
    </section>
  );
}

export default SchemeEditWeeks;
