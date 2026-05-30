'use client';
// app/dashboard/assessments/new/new-assessment-client.tsx
// batch-3-phase-3a-assessments-new-client

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AssessmentRender from '../_components/assessment-render';

type Assignment = { subjectId: string; subjectName: string; classId: string; className: string; classLevel: string | null };

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
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'generating' | 'result'>('form');
  const [selectedIdx, setSelectedIdx] = useState('');
  const [topic, setTopic]             = useState('');
  const [questionType, setType]       = useState('objective');
  const [count, setCount]             = useState(10);
  const [difficulty, setDifficulty]   = useState('medium');
  const [duration, setDuration]       = useState('');
  const [markPerQ, setMarkPerQ]       = useState('');
  const [notes, setNotes]             = useState('');
  const [result, setResult]           = useState<any>(null);
  const [saving, setSaving]           = useState(false);

  const selected = selectedIdx !== '' ? assignments[Number(selectedIdx)] : null;

  async function handleGenerate() {
    if (!selected) { toast.error('Please select a class and subject'); return; }
    if (!topic.trim()) { toast.error('Please enter a topic'); return; }

    setStep('generating');
    try {
      const res = await fetch('/api/assessments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId:       selected.classId,
          subjectId:     selected.subjectId,
          topic:         topic.trim(),
          questionType,
          count,
          difficulty,
          duration:      duration ? Number(duration) : undefined,
          markPerQuestion: markPerQ ? Number(markPerQ) : undefined,
          additionalNotes: notes || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error?.message || 'Generation failed');
        setStep('form');
        return;
      }
      setResult(data.assessment);
      setStep('result');
    } catch {
      toast.error('Network error — please try again');
      setStep('form');
    }
  }

  async function handleDiscard() {
    if (!result?.id) { setStep('form'); setResult(null); return; }
    setSaving(true);
    try {
      await fetch(`/api/assessments/${result.id}`, { method: 'DELETE' });
    } catch {}
    setSaving(false);
    setResult(null);
    setStep('form');
    toast.success('Questions discarded');
  }

  function handleKeep() {
    router.push(`/dashboard/assessments/${result.id}`);
  }

  if (step === 'generating') {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">
          Generating {count} {questionType} question{count !== 1 ? 's' : ''} for <span className="text-foreground font-medium">{topic}</span>…
        </p>
        <p className="text-xs text-muted-foreground">This usually takes 10–30 seconds.</p>
      </div>
    );
  }

  if (step === 'result' && result) {
    const questions = result.questions?.questions || [];
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{result.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {questions.length} question{questions.length !== 1 ? 's' : ''} · {result.sessionStamp}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button
              onClick={handleKeep}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View & save →
            </button>
          </div>
        </div>
        <AssessmentRender assessment={result} />
      </div>
    );
  }

  // FORM
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight">Generate exam questions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {currentSession
            ? `${currentSession.name} · ${currentSession.currentTerm === 'FIRST' ? 'Term 1' : currentSession.currentTerm === 'SECOND' ? 'Term 2' : 'Term 3'}`
            : 'No active session — ask your admin to set one'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Assignment picker */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Class & subject</label>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">
              You haven&apos;t been assigned to any subjects yet. Ask your admin.
            </p>
          ) : (
            <select
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select class & subject…</option>
              {assignments.map((a, i) => (
                <option key={i} value={i}>{a.className} — {a.subjectName}</option>
              ))}
            </select>
          )}
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Fractions and Decimals, Photosynthesis, The Civil War…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Type + difficulty row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Question type</label>
            <select
              value={questionType}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        {/* Count + duration + marks row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">No. of questions</label>
            <input
              type="number" min={1} max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Duration (mins)</label>
            <input
              type="number" min={1} max={600}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Marks / question</label>
            <input
              type="number" min={1} max={100}
              value={markPerQ}
              onChange={(e) => setMarkPerQ(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Additional notes */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Additional notes <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. Focus on past WAEC question patterns. Include at least 2 calculation questions."
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!selected || !topic.trim() || !currentSession}
          className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate {count} {questionType} question{count !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}
