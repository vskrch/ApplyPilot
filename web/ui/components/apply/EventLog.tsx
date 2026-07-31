"use client";

import type { ApplyEvent } from "@/lib/types";
import { useEffect, useRef } from "react";
import { formatDateTime } from "@/lib/utils";

interface EventLogProps {
  events: ApplyEvent[];
}

export function EventLog({ events }: EventLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const getEventStyle = (type: string) => {
    if (type.includes("complete") || type.includes("success")) return "text-[var(--success)]";
    if (type.includes("error") || type.includes("fail")) return "text-[var(--danger)]";
    if (type.includes("warn")) return "text-[var(--warning)]";
    return "text-[var(--text-secondary)]";
  };

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-3">Event Log</h3>
      <div
        ref={containerRef}
        className="h-64 overflow-y-auto font-mono text-xs space-y-1 bg-[var(--bg-secondary)] rounded p-3"
      >
        {events.length === 0 ? (
          <div className="text-[var(--text-muted)] italic">No events yet</div>
        ) : (
          events.map((event, i) => (
            <div key={i} className={getEventStyle(event.type)}>
              <span className="text-[var(--text-muted)]">
                [{formatDateTime(event.timestamp || new Date().toISOString())}]
              </span>{" "}
              <span className="text-[var(--accent)]">{event.type}</span>
              {event.message && <span> — {event.message}</span>}
              {event.title && <span> — {event.title}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
