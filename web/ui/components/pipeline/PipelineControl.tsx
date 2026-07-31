"use client";

import { useState } from "react";
import { usePipelineStore } from "@/stores/pipeline";
import { Play, Square, Settings2, Sliders, Zap } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { key: "discover", label: "Discovery (Scrape & Workday)" },
  { key: "enrich", label: "Enrichment (Cascade HTML/CSS/AI)" },
  { key: "score", label: "AI Scoring (1-10)" },
  { key: "tailor", label: "Resume Tailoring" },
  { key: "cover", label: "Cover Letter Gen" },
  { key: "pdf", label: "PDF Rendering" },
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
    toast.info(`Preset applied: ${name}`);
  };

  const handleRun = async () => {
    if (isRunning) {
      await cancelPipeline();
      toast.warning("Pipeline cancellation requested");
      return;
    }
    if (stages.length === 0) {
      toast.error("Select at least one stage to run");
      return;
    }
    try {
      await startPipeline({
        stages,
        min_score: minScore,
        workers,
        stream,
        validation,
        dry_run: dryRun,
      });
      toast.success("Pipeline execution started");
    } catch {
      toast.error("Failed to start pipeline");
    }
  };

  return (
    <div className="card space-y-5 bg-[#12161f] border-[#2a3447]">
      <div className="flex items-center justify-between border-b border-[#2a3447] pb-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Sliders size={16} className="text-blue-400" />
          Pipeline Execution Config
        </h3>
        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          CLI Engine v0.3
        </span>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Select Stages ({stages.length}/{STAGES.length})
        </label>
        <div className="space-y-1.5 bg-[#181d28] p-3 rounded-xl border border-[#2a3447]">
          {STAGES.map((s) => (
            <label
              key={s.key}
              className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-slate-100 select-none py-1 px-1 rounded hover:bg-[#222938]"
            >
              <input
                type="checkbox"
                checked={stages.includes(s.key)}
                onChange={() => toggleStage(s.key)}
                className="rounded accent-blue-500 w-3.5 h-3.5"
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Quick Presets
        </label>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm text-xs flex-1 justify-center border-[#2a3447]" onClick={() => applyPreset("full")}>
            Full Run
          </button>
          <button className="btn btn-ghost btn-sm text-xs flex-1 justify-center border-[#2a3447]" onClick={() => applyPreset("discovery")}>
            Discover Only
          </button>
          <button className="btn btn-ghost btn-sm text-xs flex-1 justify-center border-[#2a3447]" onClick={() => applyPreset("ai")}>
            AI Stages
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Minimum Fit Score Threshold</span>
            <span className="font-bold text-blue-400">{minScore} / 10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-blue-500 bg-[#2a3447] h-1.5 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Parallel Worker Threads</span>
            <span className="font-bold text-blue-400">{workers} Workers</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            value={workers}
            onChange={(e) => setWorkers(Number(e.target.value))}
            className="w-full accent-blue-500 bg-[#2a3447] h-1.5 rounded-lg"
          />
        </div>

        <div className="flex justify-between items-center bg-[#181d28] p-3 rounded-xl border border-[#2a3447]">
          <span className="text-xs text-slate-300 font-medium">Orchestration Mode</span>
          <div className="flex gap-1">
            <button
              className={`btn btn-sm text-xs ${!stream ? "btn-primary" : "btn-ghost border-[#2a3447]"}`}
              onClick={() => setStream(false)}
            >
              Sequential
            </button>
            <button
              className={`btn btn-sm text-xs ${stream ? "btn-primary" : "btn-ghost border-[#2a3447]"}`}
              onClick={() => setStream(true)}
            >
              Streaming
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center bg-[#181d28] p-3 rounded-xl border border-[#2a3447]">
          <span className="text-xs text-slate-300 font-medium">Validation Strictly Enforced</span>
          <div className="flex gap-1">
            {["strict", "normal", "lenient"].map((v) => (
              <button
                key={v}
                className={`btn btn-sm text-xs capitalize ${validation === v ? "btn-primary" : "btn-ghost border-[#2a3447]"}`}
                onClick={() => setValidation(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-[#181d28] p-3 rounded-xl border border-[#2a3447]">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="accent-blue-500"
          />
          <span>Dry Run (Simulate execution without modifying files)</span>
        </label>
      </div>

      <button
        className={`w-full justify-center btn ${
          isRunning ? "btn-danger" : "btn-primary"
        } py-3 text-sm font-semibold shadow-lg`}
        onClick={handleRun}
      >
        {isRunning ? (
          <>
            <Square size={16} /> Cancel Active Pipeline Run
          </>
        ) : (
          <>
            <Play size={16} /> Start Pipeline Execution
          </>
        )}
      </button>
    </div>
  );
}
