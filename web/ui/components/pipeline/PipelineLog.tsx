"use client";

import { useEffect, useRef } from "react";
import type { PipelineEvent } from "@/lib/types";

interface PipelineLogProps {
  events: PipelineEvent[];
}

export default function PipelineLog({ events }: PipelineLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const formatEvent = (e: PipelineEvent): string => {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    const stage = e.stage ? `[${e.stage}]` : "";
    const status = e.status ? ` ${e.status}` : "";
    if (e.type === "pipeline_complete") return `${ts}  Pipeline complete`;
    if (e.type === "pipeline_error") return `${ts}  ERROR: ${e.error || "Unknown error"}`;
    if (e.type === "stage_start") return `${ts}  ${stage} Starting...`;
    if (e.type === "stage_complete") return `${ts}  ${stage} Complete${status} (${e.elapsed?.toFixed(1)}s)`;
    if (e.type === "stage_error") return `${ts}  ${stage} ERROR: ${e.error || "Unknown"}`;
    if (e.type === "log") return `${ts}  ${e.message || ""}`;
    return `${ts}  ${e.type} ${stage}${status}`;
  };

  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 h-64 overflow-y-auto font-mono text-xs leading-relaxed">
      {events.length === 0 && (
        <div className="text-[var(--text-muted)] p-2">Waiting for pipeline events...</div>
      )}
      {events.map((e, i) => (
        <div
          key={i}
          className={`py-0.5 ${
            e.type.includes("error") ? "text-[var(--danger)]" :
            e.type.includes("complete") ? "text-[var(--success)]" :
            "text-[var(--text-secondary)]"
          }`}
        >
          {formatEvent(e)}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
