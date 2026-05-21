'use client'
// app/dashboard/lessons/_components/lesson-note-render.tsx
// batch-3-phase-1-5-render-component
//
// Pure-render component for a Klassrun lesson note. Reads from the
// LessonNote.content JSON shape (Phase 3.1.5 v2) and renders it with:
//   - KaTeX math (via <MathText>) in every text field
//   - Chalkboard-styled summary (dark surface, chalk text)
//   - Numbered timeline for presentation steps
//   - Color-coded section accents for structurally important sections
//
// Backward-compatible with Phase 3.1 notes that lack explanationOverview
// or explanationSections — those sections are simply omitted.

import { MathText } from './math-text'

type PresentationStep = {
  step: number
  title: string
  duration: number
  teacherActivity: string
  pupilActivity: string
}

type ExplanationSection = {
  subTopic: string
  content: string
}

export function LessonNoteRender({ content }: { content: Record<string, unknown> }) {
  const get = <T,>(k: string): T | undefined => content[k] as T | undefined

  const title          = String(get<string>('title') ?? 'Untitled lesson')
  const subject        = String(get<string>('subject') ?? '')
  const klass          = String(get<string>('class') ?? '')
  const week           = get<number>('week')
  const duration       = get<number>('duration') ?? 40
  const objectives     = get<string[]>('behaviouralObjectives') ?? []
  const previous       = String(get<string>('previousKnowledge') ?? '')
  const materials      = get<string[]>('instructionalMaterials') ?? []
  const presentation   = get<PresentationStep[]>('presentation') ?? []
  const overview       = String(get<string>('explanationOverview') ?? '')
  const sections       = get<ExplanationSection[]>('explanationSections') ?? []
  const chalkboard     = String(get<string>('chalkboardSummary') ?? '')
  const evaluation     = get<string[]>('evaluation') ?? []
  const assignment     = String(get<string>('assignment') ?? '')
  const reading        = get<string[]>('suggestedReading') ?? []

  return (
    <article className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight">
          <MathText text={title} />
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {subject} · {klass}
          {week != null && ` · Week ${week}`}
          {' · '}{duration} minutes
        </p>
      </header>

      {objectives.length > 0 && (
        <SectionAccent title="Behavioural objectives">
          <ol className="list-decimal pl-5 space-y-1.5 text-sm leading-relaxed">
            {objectives.map((o, i) => (
              <li key={i}><MathText text={o} /></li>
            ))}
          </ol>
        </SectionAccent>
      )}

      {previous && (
        <SectionPlain title="Previous knowledge">
          <p className="text-sm leading-relaxed"><MathText text={previous} /></p>
        </SectionPlain>
      )}

      {materials.length > 0 && (
        <SectionPlain title="Instructional materials">
          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed">
            {materials.map((m, i) => (
              <li key={i}><MathText text={m} /></li>
            ))}
          </ul>
        </SectionPlain>
      )}

      {(overview || sections.length > 0) && (
        <SectionAccent title="Explanation">
          {overview && (
            <p className="text-sm leading-relaxed mb-5">
              <MathText text={overview} />
            </p>
          )}
          {sections.length > 0 && (
            <div className="space-y-5">
              {sections.map((s, i) => (
                <div key={i}>
                  <h4 className="font-medium text-sm mb-1.5">
                    <MathText text={s.subTopic} />
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <MathText text={s.content} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionAccent>
      )}

      {presentation.length > 0 && (
        <SectionAccent title="Presentation">
          <ol className="relative space-y-6 border-l-2 border-border pl-8">
            {presentation.map((p, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[2.4rem] flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {p.step}
                </span>
                <p className="font-medium leading-tight">
                  <MathText text={p.title} />
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {p.duration} min
                  </span>
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  <strong className="text-foreground">Teacher:</strong>{' '}
                  <MathText text={p.teacherActivity} />
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  <strong className="text-foreground">Pupils:</strong>{' '}
                  <MathText text={p.pupilActivity} />
                </p>
              </li>
            ))}
          </ol>
        </SectionAccent>
      )}

      {chalkboard && <Chalkboard text={chalkboard} />}

      {evaluation.length > 0 && (
        <SectionAccent title="Evaluation">
          <ol className="list-decimal pl-5 space-y-1.5 text-sm leading-relaxed">
            {evaluation.map((e, i) => (
              <li key={i}><MathText text={e} /></li>
            ))}
          </ol>
        </SectionAccent>
      )}

      {assignment && (
        <SectionPlain title="Assignment">
          <p className="text-sm leading-relaxed"><MathText text={assignment} /></p>
        </SectionPlain>
      )}

      {reading.length > 0 && (
        <SectionPlain title="Suggested reading">
          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed">
            {reading.map((r, i) => (
              <li key={i}><MathText text={r} /></li>
            ))}
          </ul>
        </SectionPlain>
      )}
    </article>
  )
}

function SectionAccent({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-l-2 border-primary pl-6">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">
        {title}
      </h3>
      {children}
    </section>
  )
}

function SectionPlain({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Chalkboard({ text }: { text: string }) {
  return (
    <section
      className="rounded-xl p-6 shadow-inner"
      style={{ backgroundColor: '#1a3a2e' }}
    >
      <h3
        className="mb-4 text-xs font-medium uppercase tracking-[0.25em]"
        style={{ color: '#a8d4c2' }}
      >
        Chalkboard summary
      </h3>
      <pre
        className="font-display text-base leading-relaxed whitespace-pre-wrap"
        style={{ color: '#e8f0eb' }}
      >
        <MathText text={text} />
      </pre>
    </section>
  )
}
