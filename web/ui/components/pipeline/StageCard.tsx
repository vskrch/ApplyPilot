"use client";

import { CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";

interface StageCardProps {
  stage: string;
  label: string;
  status: "pending" | "running" | "complete" | "error";
  count: number;
  elapsed: number;
}

const statusIcons = {
  pending: <Clock size={16} className="text-[var(--text-muted)]" />,
  running: <Loader2 size={16} className="text-[var(--accent)] animate-spin" />,
  complete: <CheckCircle2 size={16} className="text-[var(--success)]" />,
  error: <XCircle size={16} className="text-[var(--danger)]" />,
};

const statusColors = {
  pending: "border-[var(--border)]",
  running: "border-[var(--accent)] bg-[var(--accent)]/5",
  complete: "border-[var(--success)] bg-[var(--success)]/5",
  error: "border-[var(--danger)] bg-[var(--danger)]/5",
};

export default function StageCard({ stage, label, status, count, elapsed }: StageCardProps) {
  return (
    <div className={`card p-3 border ${statusColors[status]} transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcons[status]}
          <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {elapsed > 0 ? `${elapsed.toFixed(1)}s` : "—"}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)]">{count} jobs</span>
        <span className={`badge ${
          status === "complete" ? "badge-green" :
          status === "running" ? "badge-blue" :
          status === "error" ? "badge-red" :
          "badge-gray"
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
}
