'use client';
// app/dashboard/question-bank/_components/bank-client.tsx
// batch-3-phase-3b-bank-client

import { useState, useEffect, useRef, useCallback } from 'react';
import { MathText } from '@/app/dashboard/lessons/_components/math-text';

type Entry = {
  id: string;
  question: string;
  options: Record<string, string> | null;
  answer: string | null;
  questionType: string;
  difficulty: string | null;
  topic: string;
  timesUsed: number;
  createdAt: string;
  subject?: { id: string; name: string };
};

type Subject = { id: string; name: string; class?: { name: string } };

const TYPE_LABELS: Record<string, string> = {
  objective: 'Objective',
  theory:    'Theory',
  essay:     'Essay',
};

const DIFF_CLASSES: Record<string, string> = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard:   'bg-red-100 text-red-700',
};

export default function BankClient({
  initialEntries,
  initialTotal,
  subjects,
}: {
  initialEntries: Entry[];
  initialTotal: number;
  subjects: Subject[];
}) {
  const [entries, setEntries]           = useState<Entry[]>(initialEntries);
  const [total, setTotal]               = useState(initialTotal);
  const [subjectFilter, setSubject]     = useState('');
  const [topicFilter, setTopic]         = useState('');
  const [typeFilter, setType]           = useState('');
  const [offset, setOffset]             = useState(50);
  const [loading, setLoading]           = useState(false);
  const [filtering, setFiltering]       = useState(false);
  const [expanded, setExpanded]         = useState<Record<string, boolean>>({});
  const debounceRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-fetch when filters change (debounce topic)
  const doFetch = useCallback(async (subject: string, topic: string, type: string) => {
    setFiltering(true);
    const qs = new URLSearchParams({ limit: '50', offset: '0' });
    if (subject) qs.set('subjectId', subject);
    if (topic.trim()) qs.set('topic', topic.trim());
    if (type) qs.set('questionType', type);
    try {
      const res = await fetch(`/api/assessments/bank?${qs}`);
      if (!res.ok) return;
      const body = await res.json().catch(() => ({}));
      setEntries(Array.isArray(body.entries) ? body.entries : []);
      setTotal(body.total ?? 0);
      setOffset(50);
    } finally {
      setFiltering(false);
    }
  }, []);

  function handleSubjectChange(val: string) {
    setSubject(val);
    doFetch(val, topicFilter, typeFilter);
  }

  function handleTypeChange(val: string) {
    setType(val);
    doFetch(subjectFilter, topicFilter, val);
  }

  function handleTopicChange(val: string) {
    setTopic(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(subjectFilter, val, typeFilter), 400);
  }

  async function loadMore() {
    setLoading(true);
    const qs = new URLSearchParams({ limit: '50', offset: String(offset) });
    if (subjectFilter) qs.set('subjectId', subjectFilter);
    if (topicFilter.trim()) qs.set('topic', topicFilter.trim());
    if (typeFilter) qs.set('questionType', typeFilter);
    try {
      const res = await fetch(`/api/assessments/bank?${qs}`);
      if (!res.ok) return;
      const body = await res.json().catch(() => ({}));
      const next = Array.isArray(body.entries) ? body.entries : [];
      setEntries((prev) => [...prev, ...next]);
      setOffset((prev) => prev + 50);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const hasMore = entries.length < total;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight">
            Question Bank
          </h1>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {total} question{total !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Every question your school has ever generated — growing each term.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={subjectFilter}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.class ? `${s.class.name} — ` : ''}{s.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All types</option>
          <option value="objective">Objective</option>
          <option value="theory">Theory</option>
          <option value="essay">Essay</option>
        </select>

        <input
          type="text"
          value={topicFilter}
          onChange={(e) => handleTopicChange(e.target.value)}
          placeholder="Search by topic…"
          className="flex-1 min-w-[180px] rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* List */}
      {filtering ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Filtering…</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {total === 0 && !subjectFilter && !topicFilter && !typeFilter
              ? 'No questions in your bank yet. Generate exam questions to start building it.'
              : 'No questions match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2 min-w-0">
                  {/* Question text */}
                  <div className="text-sm leading-relaxed">
                    <MathText text={entry.question} />
                  </div>

                  {/* Objective options — collapsible */}
                  {entry.questionType === 'objective' && entry.options && (
                    <div>
                      {expanded[entry.id] ? (
                        <div className="space-y-1.5 mt-2">
                          {(['A','B','C','D'] as const).map((opt) =>
                            entry.options![opt] !== undefined ? (
                              <div
                                key={opt}
                                className={[
                                  'flex items-start gap-2 rounded-lg px-3 py-1.5 text-xs',
                                  entry.answer === opt
                                    ? 'bg-primary/10 font-medium text-primary'
                                    : 'bg-muted/40',
                                ].join(' ')}
                              >
                                <span className="font-medium min-w-[1rem]">{opt}.</span>
                                <MathText text={entry.options![opt]} />
                                {entry.answer === opt && (
                                  <span className="ml-auto text-[10px] font-medium text-primary">✓</span>
                                )}
                              </div>
                            ) : null
                          )}
                          <button
                            onClick={() => toggleExpand(entry.id)}
                            className="text-xs text-muted-foreground hover:text-foreground mt-1"
                          >
                            Hide options ▲
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleExpand(entry.id)}
                          className="text-xs text-muted-foreground hover:text-foreground mt-1"
                        >
                          Show options (A–D) ▼
                        </button>
                      )}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Type badge */}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {TYPE_LABELS[entry.questionType] ?? entry.questionType}
                    </span>

                    {/* Difficulty */}
                    {entry.difficulty && (
                      <span className={[
                        'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                        DIFF_CLASSES[entry.difficulty] ?? 'bg-muted text-muted-foreground',
                      ].join(' ')}>
                        {entry.difficulty}
                      </span>
                    )}

                    {/* Topic */}
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {entry.topic}
                    </span>

                    {/* Subject */}
                    {entry.subject && (
                      <span className="text-[10px] text-muted-foreground">
                        {entry.subject.name}
                      </span>
                    )}

                    {/* Times used */}
                    <span className={[
                      'ml-auto text-[10px] font-medium',
                      entry.timesUsed > 3 ? 'text-primary' : 'text-muted-foreground',
                    ].join(' ')}>
                      Used {entry.timesUsed} time{entry.timesUsed !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading…' : `Load more (${total - entries.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
