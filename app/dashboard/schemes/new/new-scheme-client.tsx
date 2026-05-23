// app/dashboard/schemes/new/new-scheme-client.tsx
// batch-3-phase-2-schemes-new-client
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Assignment = {
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  classLevel?: string | null;
};

type Props = {
  assignments: Assignment[];
  currentSession: { name?: string; currentTerm?: string } | null;
};

const TERM_LABEL: Record<string, string> = {
  FIRST: 'Term 1',
  SECOND: 'Term 2',
  THIRD: 'Term 3',
};

export default function NewSchemeClient({ assignments: initialAssignments, currentSession }: Props) {
  const router = useRouter();
  // batch-3-phase-2-prop-sync — bug #63
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  useEffect(() => { setAssignments(initialAssignments); }, [initialAssignments]);

  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState<string>(
    initialAssignments.length > 0 ? `${initialAssignments[0].classId}::${initialAssignments[0].subjectId}` : ''
  );
  const selected = useMemo(() => {
    return assignments.find((a) => `${a.classId}::${a.subjectId}` === selectedAssignmentKey) || null;
  }, [assignments, selectedAssignmentKey]);

  const [weekCount, setWeekCount] = useState<number>(12);
  const [strictMode, setStrictMode] = useState<boolean>(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTopicAt = (i: number, v: string) => {
    setTopics((prev) => {
      const next = prev.slice();
      next[i] = v;
      return next;
    });
  };
  const addTopic = () => setTopics((prev) => (prev.length >= 13 ? prev : [...prev, '']));
  const removeTopic = (i: number) => setTopics((prev) => prev.filter((_, idx) => idx !== i));

  // When strict mode toggles ON, default topics list to weekCount empty strings (max 1 first)
  useEffect(() => {
    if (strictMode && topics.length === 0) {
      setTopics(['']);
    }
  }, [strictMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError('Please choose a class and subject.');
      return;
    }

    let topicsPayload: string[] | undefined;
    if (strictMode) {
      const cleaned = topics.map((t) => t.trim()).filter(Boolean);
      if (cleaned.length === 0) {
        setError('Add at least one topic, or turn strict mode off.');
        return;
      }
      topicsPayload = cleaned;
    }

    const weekCountToSend = strictMode && topicsPayload ? topicsPayload.length : weekCount;

    setSubmitting(true);
    try {
      const res = await fetch('/api/schemes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId:         selected.classId,
          subjectId:       selected.subjectId,
          weekCount:       weekCountToSend,
          topics:          topicsPayload,
          additionalNotes: additionalNotes.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message || `Generation failed (${res.status}).`);
        return;
      }
      router.push(`/dashboard/schemes/${body.scheme.id}`);
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (assignments.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">New Scheme of Work</h1>
        <div className="rounded-lg border border-dashed p-6">
          <p className="text-muted-foreground">
            You're not assigned to any subjects yet. Ask your school admin to assign you to a subject first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">New Scheme of Work</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Generate a 12-week scheme of work for a class you teach. Edit any week after generation.
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Class & Subject</label>
          <select
            value={selectedAssignmentKey}
            onChange={(e) => setSelectedAssignmentKey(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={submitting}
          >
            {assignments.map((a) => (
              <option key={`${a.classId}::${a.subjectId}`} value={`${a.classId}::${a.subjectId}`}>
                {a.className} — {a.subjectName}
              </option>
            ))}
          </select>
        </div>

        {currentSession ? (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            Term: <span className="font-medium">{TERM_LABEL[currentSession.currentTerm || ''] || currentSession.currentTerm}</span>{' '}
            · Session: <span className="font-medium">{currentSession.name}</span>
          </div>
        ) : (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm">
            No current academic session found. Ask your admin to set one before generating a scheme.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Number of weeks</label>
          <input
            type="number"
            min={1}
            max={13}
            value={strictMode ? topics.filter((t) => t.trim()).length || 1 : weekCount}
            onChange={(e) => setWeekCount(Math.max(1, Math.min(13, Number(e.target.value) || 12)))}
            disabled={submitting || strictMode}
            className="w-32 rounded-md border px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default 12. {strictMode ? 'Set by your topics list when strict mode is on.' : ''}
          </p>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
              disabled={submitting}
            />
            <span>I'll provide the topics myself</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            If on, the AI uses your topics in the exact order you list them.
          </p>
        </div>

        {strictMode && (
          <div className="space-y-2 rounded-md border p-3">
            <div className="text-sm font-medium">Topics (one per week)</div>
            {topics.map((t, i) => (
              <div key={i} className="flex gap-2">
                <span className="w-12 shrink-0 text-sm text-muted-foreground self-center">Wk {i + 1}</span>
                <input
                  type="text"
                  value={t}
                  onChange={(e) => setTopicAt(i, e.target.value)}
                  placeholder={`Topic for week ${i + 1}`}
                  disabled={submitting}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeTopic(i)}
                  disabled={submitting || topics.length === 1}
                  className="rounded-md border px-2 text-xs hover:bg-accent disabled:opacity-50"
                  aria-label="Remove topic"
                >
                  ✕
                </button>
              </div>
            ))}
            {topics.length < 13 && (
              <button
                type="button"
                onClick={addTopic}
                disabled={submitting}
                className="text-sm text-primary hover:underline"
              >
                + Add another week
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Additional notes for the AI (optional)</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value.slice(0, 500))}
            placeholder="e.g. 'Most students struggle with fractions, emphasise visuals.'"
            disabled={submitting}
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">{additionalNotes.length}/500</p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !currentSession}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? 'Generating your scheme… (~30-45s)' : 'Generate scheme of work'}
        </button>
      </form>
    </div>
  );
}
