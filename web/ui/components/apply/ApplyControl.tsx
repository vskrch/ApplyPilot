"use client";

import { useState } from "react";
import { useApplyStore } from "@/stores/apply";
import { api } from "@/lib/api";
import { Play, Square, RotateCcw, Cpu, Bot } from "lucide-react";
import { toast } from "sonner";

interface ApplyControlProps {
  onResetFailed?: () => void;
}

export function ApplyControl({ onResetFailed }: ApplyControlProps) {
  const { isRunning, startApply, stopApply } = useApplyStore();
  const [config, setConfig] = useState({
    workers: 2,
    model: "sonnet",
    minScore: 7,
    limit: 0,
    headless: true,
    dryRun: false,
    continuous: true,
    url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning) {
      await stopApply();
      toast.warning("Auto-apply session stopped");
    } else {
      try {
        await startApply({
          workers: config.workers,
          model: config.model,
          min_score: config.minScore,
          limit: config.limit,
          headless: config.headless,
          dry_run: config.dryRun,
          continuous: config.continuous,
          url: config.url || null,
        });
        toast.success(`Auto-apply started with ${config.workers} parallel workers`);
      } catch {
        toast.error("Failed to launch auto-apply workers");
      }
    }
  };

  const handleResetFailed = async () => {
    try {
      const res = await api.resetFailed();
      toast.success(`Reset ${res.reset_count} failed job applications`);
      onResetFailed?.();
    } catch {
      toast.error("Failed to reset failed jobs");
    }
  };

  return (
    <div className="card bg-[#12161f] border-[#2a3447] mb-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#2a3447] pb-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Bot size={16} className="text-blue-400" />
          Autonomous Application Worker Pool Config
        </h3>
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Claude Code + MCP Engine
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Parallel Worker Processes</label>
            <input
              type="number"
              min={1}
              max={8}
              value={config.workers}
              onChange={(e) => setConfig({ ...config, workers: Number(e.target.value) })}
              className="input w-full bg-[#181d28] border-[#2a3447] text-slate-200"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">LLM Form Filler Model</label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="input w-full bg-[#181d28] border-[#2a3447] text-slate-200"
              disabled={isRunning}
            >
              <option value="haiku">Claude 3.5 Haiku (Fast & Low Cost)</option>
              <option value="sonnet">Claude 3.5 Sonnet (High Precision)</option>
              <option value="opus">Claude 3 Opus (Complex Forms)</option>
            </select>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Min Score Threshold ({config.minScore})</label>
            <input
              type="range"
              min={1}
              max={10}
              value={config.minScore}
              onChange={(e) => setConfig({ ...config, minScore: Number(e.target.value) })}
              className="w-full accent-blue-500 bg-[#2a3447] h-1.5 rounded-lg mt-2"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Application Limit (0 = Unlimited)</label>
            <input
              type="number"
              min={0}
              value={config.limit}
              onChange={(e) => setConfig({ ...config, limit: Number(e.target.value) })}
              className="input w-full bg-[#181d28] border-[#2a3447] text-slate-200"
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Target Specific Job URL (Optional)</label>
            <input
              type="text"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="e.g. https://boards.greenhouse.io/company/jobs/123"
              className="input w-full bg-[#181d28] border-[#2a3447] text-slate-200"
              disabled={isRunning}
            />
          </div>
          <div className="flex items-center gap-6 pt-4">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.headless}
                onChange={(e) => setConfig({ ...config, headless: e.target.checked })}
                disabled={isRunning}
                className="accent-blue-500"
              />
              Headless Chrome
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.dryRun}
                onChange={(e) => setConfig({ ...config, dryRun: e.target.checked })}
                disabled={isRunning}
                className="accent-blue-500"
              />
              Dry Run
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.continuous}
                onChange={(e) => setConfig({ ...config, continuous: e.target.checked })}
                disabled={isRunning}
                className="accent-blue-500"
              />
              Continuous Polling
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className={`btn ${isRunning ? "btn-danger" : "btn-primary"} px-6 py-2.5 shadow-md font-semibold`}
          >
            {isRunning ? <Square size={16} /> : <Play size={16} />}
            {isRunning ? "Stop All Workers" : "Start Auto-Apply Worker Pool"}
          </button>
          <button
            type="button"
            className="btn btn-ghost border-[#2a3447] text-slate-300"
            onClick={handleResetFailed}
          >
            <RotateCcw size={15} />
            Reset All Failed Applications
          </button>
        </div>
      </form>
    </div>
  );
}
