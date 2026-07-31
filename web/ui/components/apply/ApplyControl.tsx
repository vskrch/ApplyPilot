"use client";

import { useState } from "react";
import { useApplyStore } from "@/stores/apply";
import { api } from "@/lib/api";
import { Play, Square, RotateCcw } from "lucide-react";
import { clsx } from "@/lib/utils";

interface ApplyControlProps {
  onResetFailed?: () => void;
}

export function ApplyControl({ onResetFailed }: ApplyControlProps) {
  const { isRunning, startApply, stopApply } = useApplyStore();
  const [config, setConfig] = useState({
    workers: 2,
    model: "sonnet",
    minScore: 5,
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
    } else {
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
    }
  };

  const handleResetFailed = async () => {
    await api.resetFailed();
    onResetFailed?.();
  };

  return (
    <div className="card mb-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Workers</label>
          <input
            type="number"
            min={1}
            max={8}
            value={config.workers}
            onChange={(e) => setConfig({ ...config, workers: Number(e.target.value) })}
            className="input w-full"
            disabled={isRunning}
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Model</label>
          <select
            value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
            className="input w-full"
            disabled={isRunning}
          >
            <option value="haiku">Haiku</option>
            <option value="sonnet">Sonnet</option>
            <option value="opus">Opus</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Min Score</label>
          <input
            type="range"
            min={1}
            max={10}
            value={config.minScore}
            onChange={(e) => setConfig({ ...config, minScore: Number(e.target.value) })}
            className="w-full"
            disabled={isRunning}
          />
          <span className="text-xs text-[var(--text-muted)]">{config.minScore}</span>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Limit (0=∞)</label>
          <input
            type="number"
            min={0}
            value={config.limit}
            onChange={(e) => setConfig({ ...config, limit: Number(e.target.value) })}
            className="input w-full"
            disabled={isRunning}
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Specific URL</label>
          <input
            type="text"
            value={config.url}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
            placeholder="Optional job URL"
            className="input w-full"
            disabled={isRunning}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={config.headless}
              onChange={(e) => setConfig({ ...config, headless: e.target.checked })}
              disabled={isRunning}
            />
            Headless
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={config.dryRun}
              onChange={(e) => setConfig({ ...config, dryRun: e.target.checked })}
              disabled={isRunning}
            />
            Dry Run
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={config.continuous}
              onChange={(e) => setConfig({ ...config, continuous: e.target.checked })}
              disabled={isRunning}
            />
            Continuous
          </label>
        </div>
        <div className="flex gap-2 col-span-2 md:col-span-4">
          <button
            type="submit"
            className={clsx("btn", isRunning ? "btn-danger" : "btn-primary")}
          >
            {isRunning ? <Square size={16} /> : <Play size={16} />}
            {isRunning ? "Stop" : "Start Apply"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleResetFailed}
          >
            <RotateCcw size={16} />
            Reset All Failed
          </button>
        </div>
      </form>
    </div>
  );
}
