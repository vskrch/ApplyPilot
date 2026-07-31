"use client";

import { useEffect, useCallback } from "react";
import { useApplyStore } from "@/stores/apply";
import { useWebSocket } from "@/lib/ws";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApplyControl } from "@/components/apply/ApplyControl";
import { WorkerCard } from "@/components/apply/WorkerCard";
import { EventLog } from "@/components/apply/EventLog";
import { ApplyStats } from "@/components/apply/ApplyStats";
import type { ApplyEvent } from "@/lib/types";

export default function ApplyPage() {
  const { workers, totals, events, isRunning, handleWSEvent, pollStatus } = useApplyStore();

  const onWSEvent = useCallback(
    (event: Record<string, unknown>) => {
      handleWSEvent(event as ApplyEvent);
    },
    [handleWSEvent]
  );

  useWebSocket("/ws/apply", onWSEvent);

  useEffect(() => {
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  return (
    <div className="p-6 bg-[#0a0c10] min-h-screen space-y-6">
      <PageHeader
        title="Auto-Apply Control Center"
        description="Monitor autonomous Claude Code & Chrome MCP worker sessions, execution steps, and costs in real time"
        action={
          isRunning ? (
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Worker Session Active
            </div>
          ) : undefined
        }
      />

      <ApplyControl />

      <ApplyStats
        applied={totals.applied}
        failed={totals.failed}
        cost={totals.cost}
      />

      {workers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Worker Processes ({workers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workers.map((worker) => (
              <WorkerCard key={worker.worker_id} worker={worker} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Real-Time Worker Event Log
        </h3>
        <EventLog events={events} />
      </div>
    </div>
  );
}
