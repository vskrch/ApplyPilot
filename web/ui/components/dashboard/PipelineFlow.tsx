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
    <div className="card bg-[#12161f] border-[#2a3447] p-5 rounded-xl">
      <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between border-b border-[#2a3447] pb-3">
        <span>Sequential Pipeline Stage Flow</span>
        <span className="text-[11px] font-normal text-slate-400">Total Pipeline Pipeline Throughput</span>
      </h3>
      <div className="flex items-center justify-between overflow-x-auto pt-2 pb-1">
        {stages.map((stage, i) => {
          const count = getCount(stage.key);
          const isLast = i === stages.length - 1;
          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-[90px]">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    count > 0
                      ? "bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/20"
                      : "bg-[#181d28] border-[#2a3447]"
                  }`}
                />
                <span className="text-[11px] font-medium text-slate-400 mt-2">
                  {stage.label}
                </span>
                <span className="text-sm font-bold text-slate-100 mt-0.5 font-mono">
                  {count.toLocaleString()}
                </span>
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 bg-[#2a3447]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
