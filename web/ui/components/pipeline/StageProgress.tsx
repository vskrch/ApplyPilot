"use client";

const STAGES = [
  { key: "discover", label: "Discover" },
  { key: "enrich", label: "Enrich" },
  { key: "score", label: "Score" },
  { key: "tailor", label: "Tailor" },
  { key: "cover", label: "Cover" },
  { key: "pdf", label: "PDF" },
];

interface StageProgressProps {
  currentStage: string | null;
  completedStages: string[];
}

export default function StageProgress({ currentStage, completedStages }: StageProgressProps) {
  return (
    <div className="flex items-center justify-center gap-0 py-4">
      {STAGES.map((stage, i) => {
        const isComplete = completedStages.includes(stage.key);
        const isActive = currentStage === stage.key;
        const isError = currentStage === `${stage.key}_error`;

        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`stage-dot ${
                  isActive ? "stage-active" :
                  isComplete ? "stage-complete" :
                  isError ? "!bg-[var(--danger)] !border-[var(--danger)]" :
                  ""
                }`}
              />
              <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1 ${
                  isComplete ? "bg-[var(--success)]" : "bg-[var(--border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
