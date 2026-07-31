"use client";

import { useEffect, useState } from "react";
import { usePipelineStore } from "@/stores/pipeline";
import { useWebSocket } from "@/lib/ws";
import PipelineControl from "@/components/pipeline/PipelineControl";
import StageProgress from "@/components/pipeline/StageProgress";
import StageCard from "@/components/pipeline/StageCard";
import PipelineLog from "@/components/pipeline/PipelineLog";
import { Clock } from "lucide-react";

export default function PipelinePage() {
  const isRunning = usePipelineStore((s) => s.isRunning);
  const elapsed = usePipelineStore((s) => s.elapsed);
  const events = usePipelineStore((s) => s.events);
  const handleWSEvent = usePipelineStore((s) => s.handleWSEvent);
  const pollStatus = usePipelineStore((s) => s.pollStatus);

  const [stageStats, setStageStats] = useState<Record<string, { count: number; elapsed: number; status: "pending" | "running" | "complete" | "error" }>>({});
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<string[]>([]);

  useWebSocket("/ws/pipeline", (e) => handleWSEvent(e as import("@/lib/types").PipelineEvent));

  useEffect(() => {
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stats: Record<string, { count: number; elapsed: number; status: "pending" | "running" | "complete" | "error" }> = {};
    const completed: string[] = [];

    events.forEach((e) => {
      if (e.stage) {
        const key = e.stage;
        if (!stats[key]) stats[key] = { count: 0, elapsed: 0, status: "pending" as const };

        if (e.type === "stage_start") {
          stats[key].status = "running";
          setCurrentStage(key);
        } else if (e.type === "stage_complete") {
          stats[key].status = "complete";
          stats[key].elapsed = e.elapsed || 0;
          completed.push(key);
          setCurrentStage(null);
        } else if (e.type === "stage_error") {
          stats[key].status = "error";
          setCurrentStage(`${key}_error`);
        }

        if (e.result && typeof e.result === "object" && "count" in e.result) {
          stats[key].count = (e.result as { count: number }).count;
        }
      }
    });

    setStageStats(stats);
    setCompletedStages(completed);
  }, [events]);

  const stageLabels: Record<string, string> = {
    discover: "Discover",
    enrich: "Enrich",
    score: "Score",
    tailor: "Tailor",
    cover: "Cover",
    pdf: "PDF",
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Pipeline</h1>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PipelineControl />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Pipeline Progress</h3>
                {isRunning && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Clock size={12} />
                    {elapsed.toFixed(1)}s
                  </div>
                )}
              </div>
              <StageProgress currentStage={currentStage} completedStages={completedStages} />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {Object.entries(stageLabels).map(([key, label]) => (
                  <StageCard
                    key={key}
                    stage={key}
                    label={label}
                    status={stageStats[key]?.status || "pending"}
                    count={stageStats[key]?.count || 0}
                    elapsed={stageStats[key]?.elapsed || 0}
                  />
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Live Log</h3>
              <PipelineLog events={events} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
