interface PipelineFlowProps {
  stats: Record<string, unknown>;
}

const stages = [
  { key: "total", label: "Discover" },
  { key: "with_description", label: "Enrich" },
  { key: "scored", label: "Score" },
  { key: "tailored", label: "Tailor" },
  { key: "with_cover_letter", label: "Cover" },
  { key: "ready_to_apply", label: "PDF" },
  { key: "applied", label: "Apply" },
];

export function PipelineFlow({ stats }: PipelineFlowProps) {
  const getCount = (key: string) => (stats[key] as number) || 0;

  return (
    <div className="card mb-6" style={{ background: "var(--bg-card)" }}>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Pipeline Flow
      </h3>
      <div className="flex items-center justify-between overflow-x-auto">
        {stages.map((stage, i) => {
          const count = getCount(stage.key);
          const isLast = i === stages.length - 1;
          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-[100px]">
              <div className="flex flex-col items-center">
                <div
                  className={`stage-dot ${
                    count > 0 ? "stage-complete" : ""
                  }`}
                />
                <span className="text-xs text-[var(--text-secondary)] mt-2">
                  {stage.label}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                  {count.toLocaleString()}
                </span>
              </div>
              {!isLast && (
                <div
                  className="flex-1 h-0.5 mx-2"
                  style={{ background: "var(--border)" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
