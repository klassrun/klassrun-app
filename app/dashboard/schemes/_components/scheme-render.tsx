// app/dashboard/schemes/_components/scheme-render.tsx
// batch-3-phase-2-scheme-render
// hotfix-batch-3-phase-2-mathtext
'use client';

import { MathText } from '../../lessons/_components/math-text';
import { AlignedNoteButton } from './aligned-note-button'; // batch-4b-render-uploaded
import { SchemeEditWeeks } from './scheme-edit-weeks';

type Week = {
  weekNumber: number;
  topic: string;
  objectives: string[];
  activities: string[];
  assessment: string;
  resources?: string[];
};

type SchemeContent = {
  title: string;
  subject?: string;
  class?: string;
  term?: string;
  sessionName?: string;
  overview: string;
  weeks: Week[];
  _metadata?: any;
};

type Props = {
  scheme: {
    id: string;
    title: string;
    sessionStamp: string;
    isEdited: boolean;
    createdAt: string;
    content: SchemeContent;
    class?: { name?: string; level?: string | null };
    subject?: { name?: string };
    teacher?: { firstName?: string; lastName?: string };
  };
};

export function SchemeRender({ scheme }: Props) {
  const c = scheme.content || ({} as SchemeContent);
  const weeks: Week[] = Array.isArray(c.weeks) ? c.weeks : [];
  // batch-4b-render-uploaded
  const meta: any = (c as any)._metadata || {};
  const uploaded = meta.origin === 'uploaded' || (scheme as any).origin === 'uploaded';
  const parseStatus = meta.parseStatus || (scheme as any).parseStatus || null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-semibold">{c.title || scheme.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {scheme.class?.name}
          {scheme.subject?.name ? ` · ${scheme.subject.name}` : ''}
          {scheme.sessionStamp ? ` · ${scheme.sessionStamp}` : ''}
        </p>
        {scheme.isEdited ? <p className="text-xs text-muted-foreground mt-1">Edited</p> : null}
        {uploaded ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">Uploaded</span>
            {parseStatus === 'failed' ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">Needs review</span>
            ) : null}
            {(scheme as any).sourceFileUrl ? (
              <a href={(scheme as any).sourceFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline hover:text-foreground">Original file</a>
            ) : null}
          </div>
        ) : null}
      </header>

      {c.overview ? (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Overview</h2>
          <p className="text-sm leading-relaxed">
            <MathText text={c.overview} />
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Weekly plan</h2>
        <div className="space-y-3">
          {weeks.map((w) => (
            <article key={w.weekNumber} className="rounded-lg border p-4">
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Week {w.weekNumber}</div>
              </div>
              <h3 className="text-base font-medium mb-2">
                <MathText text={w.topic} />
              </h3>
              {uploaded ? (
                <AlignedNoteButton schemeId={scheme.id} week={w.weekNumber} topic={w.topic} />
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Objectives</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {w.objectives.map((o, i) => (
                      <li key={i}><MathText text={o} /></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Activities</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {w.activities.map((a, i) => (
                      <li key={i}><MathText text={a} /></li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Assessment</div>
                  <p className="text-sm"><MathText text={w.assessment} /></p>
                </div>
                {Array.isArray(w.resources) && w.resources.length > 0 ? (
                  <div className="md:col-span-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Resources</div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {w.resources.map((r, i) => (
                        <li key={i}><MathText text={r} /></li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {uploaded ? (
        <SchemeEditWeeks schemeId={scheme.id} content={c as any} />
      ) : null}

      <footer className="mt-8 flex items-center gap-3 border-t pt-4">
        <button
          type="button"
          disabled
          className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground"
          title="Available in a future update"
        >
          Export PDF (coming soon)
        </button>
      </footer>
    </div>
  );
}

export default SchemeRender;
