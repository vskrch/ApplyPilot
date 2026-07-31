"use client";

interface ResumeDiffProps {
  original: string;
  tailored: string | null;
}

export default function ResumeDiff({ original, tailored }: ResumeDiffProps) {
  if (!tailored) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)] text-sm">
        No tailored resume available for this job.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Original Resume</h4>
        <pre className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto">
          {original}
        </pre>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Tailored Resume</h4>
        <pre className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto">
          {tailored}
        </pre>
      </div>
    </div>
  );
}
