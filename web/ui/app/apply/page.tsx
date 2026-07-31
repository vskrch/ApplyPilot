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
  const { workers, totals, events, handleWSEvent, pollStatus } = useApplyStore();

  const onWSEvent = useCallback(
    (event: Record<string, unknown>) => {
      handleWSEvent(event as ApplyEvent);
    },
    [handleWSEvent]
  );

  useWebSocket("/ws/apply", onWSEvent);

  useEffect(() => {
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  return (
    <div className="p-6">
      <PageHeader
        title="Apply Control"
        description="Manage automated job applications"
      />
      <ApplyControl />
      <ApplyStats
        applied={totals.applied}
        failed={totals.failed}
        cost={totals.cost}
      />
      {workers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {workers.map((worker) => (
            <WorkerCard key={worker.worker_id} worker={worker} />
          ))}
        </div>
      )}
      <EventLog events={events} />
    </div>
  );
}
