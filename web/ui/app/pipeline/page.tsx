"use client";

import { useEffect, useState } from "react";
import { usePipelineStore } from "@/stores/pipeline";
import { useWebSocket } from "@/lib/ws";
import PipelineControl from "@/components/pipeline/PipelineControl";
import StageProgress from "@/components/pipeline/StageProgress";
import StageCard from "@/components/pipeline/StageCard";
import PipelineLog from "@/components/pipeline/PipelineLog";
import { Clock, Play, CheckCircle2, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-[#0a0c10] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#2a3447]">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            Pipeline Control Center
            {isRunning && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Pipeline Active
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure stage parameters, monitor real-time WebSocket progress, and view live pipeline logs
          </p>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-[#181d28] border border-[#2a3447] text-slate-300">
            <Clock size={14} className="text-blue-400" />
            Elapsed: {elapsed.toFixed(1)}s
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PipelineControl />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-[#12161f] border-[#2a3447] space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a3447] pb-3">
              <h3 className="text-sm font-bold text-slate-100">Live Stage Orchestration</h3>
              <span className="text-xs text-slate-400 font-mono">
                {completedStages.length} of 6 Stages Complete
              </span>
            </div>
            <StageProgress currentStage={currentStage} completedStages={completedStages} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
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

          <div className="card bg-[#12161f] border-[#2a3447] space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-[#2a3447] pb-3">
              <span>Real-Time Execution Logs</span>
              <span className="text-[11px] text-slate-400 font-normal">Streaming via /ws/pipeline</span>
            </h3>
            <PipelineLog events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
