'use client';
// app/dashboard/assessments/_components/assessment-render.tsx
// batch-3-phase-3a-assessment-render

import { MathText } from '@/app/dashboard/lessons/_components/math-text';

type Assessment = {
  id: string;
  title: string;
  totalMarks?: number | null;
  duration?: number | null;
  sessionStamp: string;
  questions: any; // persisted content blob (includes _metadata)
  subject?: { name: string };
  class?: { name: string; level?: string | null };
  teacher?: { firstName: string; lastName: string };
};

export default function AssessmentRender({ assessment }: { assessment: Assessment }) {
  const content = assessment.questions || {};
  const questions = Array.isArray(content.questions) ? content.questions : [];
  const qType = content.questionType || '';

  // batch-3-phase-3c-end-of-term-render
  // End-of-term assessments have a "sections" structure instead of flat "questions"
  if (qType === 'end_of_term' && content.sections) {
    const sections = content.sections as any;
    const objQs    = sections.objective?.questions || [];
    const thryQs   = sections.theory?.questions    || [];
    const essQs    = sections.essay?.questions     || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {assessment.class?.name && <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{assessment.class.name}</span>}
            {assessment.subject?.name && <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">· {assessment.subject.name}</span>}
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">End-of-Term Exam</span>
          </div>
          <h2 className="font-display text-xl font-medium leading-tight tracking-tight mt-2">{assessment.title}</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {assessment.totalMarks && <span><b className="text-foreground">{assessment.totalMarks}</b> total marks</span>}
            {assessment.duration   && <span><b className="text-foreground">{assessment.duration}</b> minutes</span>}
            <span>{assessment.sessionStamp}</span>
          </div>
          {Array.isArray(content.topicsCovered) && content.topicsCovered.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {content.topicsCovered.map((t: string, i: number) => (
                <span key={i} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Objective section */}
        {objQs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-medium">Section A — Objective</h3>
              <span className="text-xs text-muted-foreground">{objQs.length} questions</span>
            </div>
            {sections.objective?.instructions && (
              <p className="text-xs text-muted-foreground italic">{sections.objective.instructions}</p>
            )}
            <div className="space-y-3">
              {objQs.map((q: any, i: number) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="editorial-number text-base text-primary/50 min-w-[1.5rem] pt-0.5">{i + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <div className="text-sm leading-relaxed"><MathText text={q.question} /></div>
                      <div className="space-y-1">
                        {(['A','B','C','D'] as const).map(opt => q.options?.[opt] !== undefined && (
                          <div key={opt} className={['flex items-start gap-2 rounded-lg px-3 py-1.5 text-sm', q.answer === opt ? 'bg-primary/10 font-medium text-primary' : 'bg-muted/40'].join(' ')}>
                            <span className="font-medium min-w-[1rem]">{opt}.</span>
                            <MathText text={q.options[opt]} />
                            {q.answer === opt && <span className="ml-auto text-[10px] font-medium text-primary">✓</span>}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        {q.topic && <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">{q.topic}</span>}
                        {q.difficulty && <span className={['rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', q.difficulty==='easy'?'bg-green-100 text-green-700':q.difficulty==='hard'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'].join(' ')}>{q.difficulty}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Theory section */}
        {thryQs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-medium">Section B — Theory</h3>
              <span className="text-xs text-muted-foreground">{thryQs.length} questions</span>
            </div>
            {sections.theory?.instructions && (
              <p className="text-xs text-muted-foreground italic">{sections.theory.instructions}</p>
            )}
            <div className="space-y-3">
              {thryQs.map((q: any, i: number) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="editorial-number text-base text-primary/50 min-w-[1.5rem] pt-0.5">{i + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <div className="text-sm leading-relaxed"><MathText text={q.question} /></div>
                      <div className="flex items-center gap-2">
                        {q.marks && <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>}
                        {q.topic && <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">{q.topic}</span>}
                        {q.difficulty && <span className={['rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', q.difficulty==='easy'?'bg-green-100 text-green-700':q.difficulty==='hard'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'].join(' ')}>{q.difficulty}</span>}
                      </div>
                      {Array.isArray(q.markingGuide) && q.markingGuide.length > 0 && (
                        <details className="group">
                          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
                            <span className="group-open:hidden">▶ Marking guide</span>
                            <span className="hidden group-open:inline">▼ Marking guide</span>
                          </summary>
                          <ul className="mt-2 space-y-1 border-l-2 border-primary/20 pl-3">
                            {q.markingGuide.map((pt: string, j: number) => <li key={j} className="text-xs text-muted-foreground leading-relaxed"><MathText text={pt} /></li>)}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Essay section */}
        {essQs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-medium">Section C — Essay</h3>
              <span className="text-xs text-muted-foreground">{essQs.length} question{essQs.length !== 1 ? 's' : ''}</span>
            </div>
            {sections.essay?.instructions && (
              <p className="text-xs text-muted-foreground italic">{sections.essay.instructions}</p>
            )}
            <div className="space-y-3">
              {essQs.map((q: any, i: number) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="editorial-number text-base text-primary/50 min-w-[1.5rem] pt-0.5">{i + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <div className="text-sm leading-relaxed"><MathText text={q.question} /></div>
                      <div className="flex items-center gap-2">
                        {q.marks && <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>}
                        {q.expectedWordCount && <span className="text-xs text-muted-foreground">~{q.expectedWordCount} words</span>}
                        {q.topic && <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">{q.topic}</span>}
                      </div>
                      {q.markingGuide && (
                        <details className="group">
                          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
                            <span className="group-open:hidden">▶ Marking rubric</span>
                            <span className="hidden group-open:inline">▼ Marking rubric</span>
                          </summary>
                          <div className="mt-2 space-y-2 border-l-2 border-primary/20 pl-3">
                            {(['content','organisation','language'] as const).map(k => q.markingGuide[k] && (
                              <div key={k}><p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{k}</p><p className="text-xs text-muted-foreground mt-0.5">{q.markingGuide[k]}</p></div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // hotfix-batch-3-phase-3d-qtype-dedup: removed duplicate `const qType` (declared once at top)

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {assessment.class?.name && (
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{assessment.class.name}</span>
          )}
          {assessment.subject?.name && (
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">· {assessment.subject.name}</span>
          )}
          {qType && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary capitalize">{qType}</span>
          )}
        </div>
        <h2 className="font-display text-xl font-medium leading-tight tracking-tight mt-2">{assessment.title}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {assessment.totalMarks && <span><b className="text-foreground">{assessment.totalMarks}</b> total marks</span>}
          {assessment.duration   && <span><b className="text-foreground">{assessment.duration}</b> minutes</span>}
          <span>{assessment.sessionStamp}</span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q: any, i: number) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-3">
              <span className="editorial-number text-xl text-primary/50 min-w-[1.5rem] pt-0.5">{i + 1}.</span>
              <div className="flex-1 space-y-3">
                <div className="text-sm leading-relaxed">
                  <MathText text={q.question} />
                </div>

                {/* Objective options */}
                {qType === 'objective' && q.options && (
                  <div className="space-y-1.5 ml-1">
                    {(['A','B','C','D'] as const).map((opt) => (
                      q.options[opt] !== undefined && (
                        <div key={opt} className={[
                          'flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
                          q.answer === opt ? 'bg-primary/10 font-medium text-primary' : 'bg-muted/40',
                        ].join(' ')}>
                          <span className="font-medium min-w-[1rem]">{opt}.</span>
                          <MathText text={q.options[opt]} />
                          {q.answer === opt && <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-primary">✓</span>}
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Theory marking guide */}
                {qType === 'theory' && (
                  <div className="space-y-1.5">
                    {q.marks && <p className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>}
                    {Array.isArray(q.markingGuide) && q.markingGuide.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
                          <span className="group-open:hidden">▶ Marking guide</span>
                          <span className="hidden group-open:inline">▼ Marking guide</span>
                        </summary>
                        <ul className="mt-2 space-y-1 border-l-2 border-primary/20 pl-3">
                          {q.markingGuide.map((pt: string, j: number) => (
                            <li key={j} className="text-xs text-muted-foreground leading-relaxed">
                              <MathText text={pt} />
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}

                {/* Essay marking guide */}
                {qType === 'essay' && (
                  <div className="space-y-1.5">
                    {q.marks && <p className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>}
                    {q.expectedWordCount && <p className="text-xs text-muted-foreground">Expected: ~{q.expectedWordCount} words</p>}
                    {q.markingGuide && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
                          <span className="group-open:hidden">▶ Marking rubric</span>
                          <span className="hidden group-open:inline">▼ Marking rubric</span>
                        </summary>
                        <div className="mt-2 space-y-2 border-l-2 border-primary/20 pl-3">
                          {(['content','organisation','language'] as const).map((key) => (
                            q.markingGuide[key] && (
                              <div key={key}>
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{key}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{q.markingGuide[key]}</p>
                              </div>
                            )
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {/* Difficulty badge */}
                {q.difficulty && (
                  <span className={[
                    'inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                    q.difficulty === 'easy'   ? 'bg-green-100 text-green-700' :
                    q.difficulty === 'hard'   ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700',
                  ].join(' ')}>
                    {q.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
