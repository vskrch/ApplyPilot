"use client";

import { useState } from "react";
import { usePipelineStore } from "@/stores/pipeline";
import { Play, Square, Loader2 } from "lucide-react";

const STAGES = [
  { key: "discover", label: "Discover" },
  { key: "enrich", label: "Enrich" },
  { key: "score", label: "Score" },
  { key: "tailor", label: "Tailor" },
  { key: "cover", label: "Cover" },
  { key: "pdf", label: "PDF" },
];

const PRESETS: Record<string, string[]> = {
  full: ["discover", "enrich", "score", "tailor", "cover", "pdf"],
  discovery: ["discover"],
  ai: ["enrich", "score", "tailor", "cover", "pdf"],
};

export default function PipelineControl() {
  const isRunning = usePipelineStore((s) => s.isRunning);
  const startPipeline = usePipelineStore((s) => s.startPipeline);
  const cancelPipeline = usePipelineStore((s) => s.cancelPipeline);

  const [stages, setStages] = useState<string[]>(["discover", "enrich", "score", "tailor", "cover", "pdf"]);
  const [minScore, setMinScore] = useState(7);
  const [workers, setWorkers] = useState(1);
  const [stream, setStream] = useState(false);
  const [validation, setValidation] = useState("normal");
  const [dryRun, setDryRun] = useState(false);

  const toggleStage = (key: string) => {
    setStages((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const applyPreset = (name: string) => {
    setStages([...PRESETS[name]]);
  };

  const handleRun = async () => {
    if (isRunning) {
      await cancelPipeline();
      return;
    }
    await startPipeline({
      stages,
      min_score: minScore,
      workers,
      stream,
      validation,
      dry_run: dryRun,
    });
  };

  return (
    <div className="card space-y-5">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Pipeline Control</h3>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Stages</label>
        <div className="grid grid-cols-2 gap-1.5">
          {STAGES.map((s) => (
            <label
              key={s.key}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]"
            >
              <input
                type="checkbox"
                checked={stages.includes(s.key)}
                onChange={() => toggleStage(s.key)}
                className="accent-[var(--accent)]"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Quick Presets</label>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm text-xs" onClick={() => applyPreset("full")}>
            Full Pipeline
          </button>
          <button className="btn btn-ghost btn-sm text-xs" onClick={() => applyPreset("discovery")}>
            Discovery Only
          </button>
          <button className="btn btn-ghost btn-sm text-xs" onClick={() => applyPreset("ai")}>
            AI Stages Only
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
          Min Score: {minScore}
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
          Workers: {workers}
        </label>
        <input
          type="range"
          min={1}
          max={8}
          value={workers}
          onChange={(e) => setWorkers(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
          <span>1</span>
          <span>8</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Mode</label>
        <div className="flex gap-2">
          <button
            className={`btn btn-sm ${!stream ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setStream(false)}
          >
            Sequential
          </button>
          <button
            className={`btn btn-sm ${stream ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setStream(true)}
          >
            Streaming
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Validation</label>
        <div className="flex gap-3">
          {["strict", "normal", "lenient"].map((v) => (
            <label key={v} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] cursor-pointer">
              <input
                type="radio"
                name="validation"
                value={v}
                checked={validation === v}
                onChange={() => setValidation(v)}
                className="accent-[var(--accent)]"
              />
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
        <input
          type="checkbox"
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Dry Run
      </label>

      <button
        className={`w-full justify-center btn ${
          isRunning ? "btn-danger" : "btn-primary"
        } py-3 text-base font-semibold`}
        onClick={handleRun}
      >
        {isRunning ? (
          <>
            <Square size={16} />
            Cancel
          </>
        ) : (
          <>
            <Play size={16} />
            Run Pipeline
          </>
        )}
      </button>
    </div>
  );
}
