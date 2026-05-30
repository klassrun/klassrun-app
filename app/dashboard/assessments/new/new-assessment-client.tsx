'use client';
// app/dashboard/assessments/new/new-assessment-client.tsx
// batch-3-phase-3a-assessments-new-client
// batch-3-phase-3c-assessments-new-client

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AssessmentRender from '../_components/assessment-render';

type Assignment = { subjectId: string; subjectName: string; classId: string; className: string; classLevel: string | null };
type Mode = 'practice' | 'end_of_term';

const QUESTION_TYPES = [
  { value: 'objective', label: 'Objective (MCQ)' },
  { value: 'theory',    label: 'Theory' },
  { value: 'essay',     label: 'Essay' },
];
const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard',   label: 'Hard' },
];

export default function NewAssessmentClient({
  assignments,
  currentSession,
}: {
  assignments: Assignment[];
  currentSession: any | null;
}) {
  const router  = useRouter();
  const [mode, setMode] = useState<Mode>('practice');

  // Shared
  const [step, setStep]           = useState<'form' | 'generating' | 'result'>('form');
  const [selectedIdx, setSelIdx]  = useState('');
  const [difficulty, setDiff]     = useState('medium');
  const [duration, setDuration]   = useState('');
  const [notes, setNotes]         = useState('');
  const [result, setResult]       = useState<any>(null);
  const [saving, setSaving]       = useState(false);

  // Practice mode
  const [topic, setTopic]         = useState('');
  const [questionType, setType]   = useState('objective');
  const [count, setCount]         = useState(10);
  const [markPerQ, setMarkPerQ]   = useState('');

  // End-of-term mode
  const [topics, setTopics]           = useState<string[]>([]);
  const [checkedTopics, setChecked]   = useState<Set<string>>(new Set());
  const [customTopic, setCustomTopic] = useState('');
  const [loadingTopics, setLoadingT]  = useState(false);
  const [objCount, setObj]            = useState(40);
  const [thryCount, setThry]          = useState(5);
  const [essCount, setEss]            = useState(1);

  const selected = selectedIdx !== '' ? assignments[Number(selectedIdx)] : null;

  // Fetch topics when subject selected in end-of-term mode
  useEffect(() => {
    if (mode !== 'end_of_term' || !selected || !currentSession) return;
    setLoadingT(true);
    setTopics([]);
    setChecked(new Set());
    const qs = new URLSearchParams({
      subjectId: selected.subjectId,
      sessionId: currentSession.id || '',
    });
    fetch(`/api/assessments/topics?${qs}`)
      .then(r => r.json())
      .then(data => {
        const t: string[] = Array.isArray(data.topics) ? data.topics : [];
        setTopics(t);
        setChecked(new Set(t));
      })
      .catch(() => {})
      .finally(() => setLoadingT(false));
  }, [mode, selected?.subjectId, currentSession?.id]);

  function toggleTopic(t: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  function addCustomTopic() {
    const t = customTopic.trim();
    if (!t) return;
    if (!topics.includes(t)) setTopics(prev => [...prev, t]);
    setChecked(prev => new Set([...prev, t]));
    setCustomTopic('');
  }

  async function handleGenerate() {
    if (!selected) { toast.error('Please select a class and subject'); return; }
    if (mode === 'practice' && !topic.trim()) { toast.error('Please enter a topic'); return; }
    if (mode === 'end_of_term') {
      const chosen = topics.filter(t => checkedTopics.has(t));
      if (chosen.length === 0) { toast.error('Please select at least one topic'); return; }
    }
    if (!currentSession) { toast.error('No active session'); return; }

    setStep('generating');
    try {
      if (mode === 'practice') {
        const res = await fetch('/api/assessments/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: selected.classId, subjectId: selected.subjectId,
            topic: topic.trim(), questionType, count, difficulty,
            duration: duration ? Number(duration) : undefined,
            markPerQuestion: markPerQ ? Number(markPerQ) : undefined,
            additionalNotes: notes || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { toast.error(data?.error?.message || 'Generation failed'); setStep('form'); return; }
        setResult(data.assessment);
      } else {
        const chosen = topics.filter(t => checkedTopics.has(t));
        const res = await fetch('/api/assessments/end-of-term', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: selected.classId, subjectId: selected.subjectId,
            topics: chosen, objectiveCount: objCount, theoryCount: thryCount, essayCount: essCount,
            difficulty, duration: duration ? Number(duration) : 180,
            additionalNotes: notes || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { toast.error(data?.error?.message || 'Generation failed'); setStep('form'); return; }
        setResult(data.assessment);
      }
      setStep('result');
    } catch { toast.error('Network error — please try again'); setStep('form'); }
  }

  async function handleDiscard() {
    if (!result?.id) { setStep('form'); setResult(null); return; }
    setSaving(true);
    try { await fetch(`/api/assessments/${result.id}`, { method: 'DELETE' }); } catch {}
    setSaving(false); setResult(null); setStep('form');
    toast.success('Questions discarded');
  }

  function handleKeep() { router.push(`/dashboard/assessments/${result.id}`); }

  // ── Generating screen ──────────────────────────────────────────────────────
  if (step === 'generating') {
    const label = mode === 'end_of_term'
      ? `end-of-term exam covering ${topics.filter(t => checkedTopics.has(t)).length} topic${topics.filter(t => checkedTopics.has(t)).length !== 1 ? 's' : ''}`
      : `${count} ${questionType} question${count !== 1 ? 's' : ''} on "${topic}"`;
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Generating <span className="text-foreground font-medium">{label}</span>…</p>
        <p className="text-xs text-muted-foreground">
          {mode === 'end_of_term' ? 'This takes 20–40 seconds.' : 'This usually takes 10–30 seconds.'}
        </p>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    const content  = result.questions || {};
    const isEoT    = content.questionType === 'end_of_term';
    const sections = content.sections || {};
    const flatQs   = isEoT
      ? [...(sections.objective?.questions || []), ...(sections.theory?.questions || []), ...(sections.essay?.questions || [])]
      : (content.questions || []);
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{result.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {flatQs.length} question{flatQs.length !== 1 ? 's' : ''} · {result.sessionStamp}
              {result.totalMarks ? ` · ${result.totalMarks} marks` : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDiscard} disabled={saving} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">Discard</button>
            <button onClick={handleKeep} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">View & save →</button>
          </div>
        </div>
        <AssessmentRender assessment={result} />
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight">Generate exam questions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {currentSession
            ? `${currentSession.name} · ${currentSession.currentTerm === 'FIRST' ? 'Term 1' : currentSession.currentTerm === 'SECOND' ? 'Term 2' : 'Term 3'}`
            : 'No active session — ask your admin to set one'}
        </p>
      </div>

      {/* Toggle */}
      <div className="mb-8 flex rounded-lg border border-border bg-muted/40 p-1 gap-1">
        <button
          onClick={() => setMode('practice')}
          className={[
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
            mode === 'practice'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          Practice / Assignment
        </button>
        <button
          onClick={() => setMode('end_of_term')}
          className={[
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
            mode === 'end_of_term'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          End-of-Term Exam
        </button>
      </div>

      <div className="space-y-6">
        {/* Class & subject — shared */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Class & subject</label>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">You haven&apos;t been assigned to any subjects yet. Ask your admin.</p>
          ) : (
            <select value={selectedIdx} onChange={(e) => setSelIdx(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Select class & subject…</option>
              {assignments.map((a, i) => <option key={i} value={i}>{a.className} — {a.subjectName}</option>)}
            </select>
          )}
        </div>

        {/* ── PRACTICE MODE fields ─────────────────────────────────────────── */}
        {mode === 'practice' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Topic</label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Fractions and Decimals, Photosynthesis, The Civil War…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Question type</label>
                <select value={questionType} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDiff(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">No. of questions</label>
                <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Duration (mins)</label>
                <input type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Optional" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Marks / question</label>
                <input type="number" min={1} max={100} value={markPerQ} onChange={(e) => setMarkPerQ(e.target.value)} placeholder="Optional" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </>
        )}

        {/* ── END-OF-TERM MODE fields ──────────────────────────────────────── */}
        {mode === 'end_of_term' && (
          <>
            {/* Topics */}
            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Topics covered this term
                <span className="normal-case font-normal ml-1">(from your lesson notes)</span>
              </label>

              {!selected ? (
                <p className="text-xs text-muted-foreground">Select a class & subject above to load topics.</p>
              ) : loadingTopics ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <div className="h-3.5 w-3.5 rounded-full border border-primary border-t-transparent animate-spin" />
                  Loading topics from your lesson notes…
                </div>
              ) : topics.length === 0 ? (
                <p className="text-xs text-muted-foreground rounded-lg border border-dashed p-3">
                  No lesson notes found for this subject this term. Add topics manually below.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-border p-3">
                  {topics.map(t => (
                    <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checkedTopics.has(t)}
                        onChange={() => toggleTopic(t)}
                        className="h-3.5 w-3.5 rounded border-border accent-primary"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">{t}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Add custom topic */}
              {selected && !loadingTopics && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
                    placeholder="Add a topic not in your notes…"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={addCustomTopic}
                    type="button"
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}

              {checkedTopics.size > 0 && (
                <p className="text-xs text-muted-foreground">{checkedTopics.size} topic{checkedTopics.size !== 1 ? 's' : ''} selected</p>
              )}
            </div>

            {/* Question breakdown */}
            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Question breakdown</label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Objective</label>
                  <input type="number" min={0} max={60} value={objCount} onChange={(e) => setObj(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Theory</label>
                  <input type="number" min={0} max={20} value={thryCount} onChange={(e) => setThry(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Essay</label>
                  <input type="number" min={0} max={10} value={essCount} onChange={(e) => setEss(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {objCount + thryCount + essCount} questions
              </p>
            </div>

            {/* Difficulty + duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDiff(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Duration (mins)</label>
                <input type="number" min={1} max={600} value={duration || 180} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </>
        )}

        {/* Additional notes — shared */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Additional notes <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3}
            placeholder={mode === 'end_of_term' ? 'e.g. Match WAEC 2024 format. Emphasise calculation questions.' : 'e.g. Focus on past WAEC question patterns. Include at least 2 calculation questions.'}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={
            !selected || !currentSession ||
            (mode === 'practice' && !topic.trim()) ||
            (mode === 'end_of_term' && checkedTopics.size === 0)
          }
          className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mode === 'end_of_term'
            ? `Generate end-of-term exam (${objCount} obj · ${thryCount} theory · ${essCount} essay)`
            : `Generate ${count} ${questionType} question${count !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
