// app/dashboard/schemes/upload/upload-scheme-client.tsx
// batch-4b-upload-client
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

const TERM_LABEL: Record<string, string> = { FIRST: 'Term 1', SECOND: 'Term 2', THIRD: 'Term 3' };
const MAX_BYTES = 10 * 1024 * 1024;

type Phase = 'idle' | 'signing' | 'uploading' | 'parsing';

export default function UploadSchemeClient({ assignments: initialAssignments, currentSession }: Props) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  useEffect(() => { setAssignments(initialAssignments); }, [initialAssignments]);

  const [selectedKey, setSelectedKey] = useState<string>(
    initialAssignments.length > 0 ? `${initialAssignments[0].classId}::${initialAssignments[0].subjectId}` : ''
  );
  const selected = useMemo(
    () => assignments.find((a) => `${a.classId}::${a.subjectId}` === selectedKey) || null,
    [assignments, selectedKey]
  );

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const busy = phase !== 'idle';

  const phaseLabel: Record<Phase, string> = {
    idle: 'Upload scheme',
    signing: 'Preparing upload…',
    uploading: 'Uploading…',
    parsing: 'Reading your scheme… (~20-40s)',
  };

  function pickFile() {
    document.getElementById('scheme-file-input')?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setError(null);
    if (!file) return;
    if (!selected) { setError('Please choose a class and subject first.'); return; }
    if (!currentSession) { setError('No current academic session. Ask your admin to set one.'); return; }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
      setError('Only PDF or DOCX files are supported.');
      return;
    }
    if (file.size > MAX_BYTES) { setError('File must be 10MB or less.'); return; }
    setFileName(file.name);

    try {
      // 1) signature
      setPhase('signing');
      const sigRes = await fetch('/api/schemes/upload-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selected.classId, subjectId: selected.subjectId }),
      });
      if (!sigRes.ok) {
        const d = await sigRes.json().catch(() => ({}));
        throw new Error(d?.error?.message || 'Could not prepare upload');
      }
      const wrap = await sigRes.json();
      const sig = wrap && wrap.signature ? wrap.signature : wrap;

      // 2) upload directly to Cloudinary RAW endpoint
      setPhase('uploading');
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', sig.apiKey);
      form.append('timestamp', String(sig.timestamp));
      form.append('signature', sig.signature);
      form.append('upload_preset', sig.preset);
      form.append('folder', sig.folder);
      form.append('public_id', sig.publicId);
      const resourceType = sig.resourceType || 'raw';
      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`, {
        method: 'POST',
        body: form,
      });
      if (!upRes.ok) {
        // Surface Cloudinary's reason (e.g. resource-type not allowed) so the
        // fix is obvious if the preset ever rejects raw.
        const t = await upRes.text().catch(() => '');
        throw new Error('Cloudinary upload failed. ' + (t ? t.slice(0, 180) : `(${upRes.status})`));
      }
      const upData = await upRes.json();
      const fileUrl: string = upData.secure_url;
      if (!fileUrl) throw new Error('Upload succeeded but no file URL returned.');

      // 3) hand URL to our API → fetch + extract + parse + persist
      setPhase('parsing');
      const res = await fetch('/api/schemes/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selected.classId,
          subjectId: selected.subjectId,
          fileUrl,
          fileName: file.name,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message || `Upload failed (${res.status}).`);
        setPhase('idle');
        return;
      }
      // Success — go to the scheme detail (review/edit parsed weeks there)
      router.push(`/dashboard/schemes/${body.scheme.id}`);
    } catch (err: any) {
      setError(err?.message || 'Network error');
      setPhase('idle');
    }
  }

  if (assignments.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Upload a Scheme of Work</h1>
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
      <h1 className="text-2xl font-semibold mb-2">Upload a Scheme of Work</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Upload your school's existing scheme (PDF or Word). Klassrun reads it into editable weeks,
        then generates lesson notes aligned to it. You can review and fix the parsed weeks before using them.
      </p>

      <input id="scheme-file-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={onFile} />

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Class & Subject</label>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={busy}
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
            No current academic session found. Ask your admin to set one before uploading.
          </div>
        )}

        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">PDF or DOCX · up to 10MB</p>
          {fileName && <p className="text-xs text-muted-foreground mb-3">Selected: {fileName}</p>}
          <button
            type="button"
            onClick={pickFile}
            disabled={busy || !currentSession}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {phaseLabel[phase]}
          </button>
          {phase === 'parsing' && (
            <p className="mt-3 text-xs text-muted-foreground">Reading and structuring your scheme — this can take a moment.</p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
