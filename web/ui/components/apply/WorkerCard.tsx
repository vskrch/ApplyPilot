import type { WorkerInfo } from "@/lib/types";
import { clsx } from "@/lib/utils";

interface WorkerCardProps {
  worker: WorkerInfo;
}

const statusColors: Record<string, string> = {
  idle: "badge-gray",
  searching: "badge-blue",
  scoring: "badge-yellow",
  tailoring: "badge-yellow",
  applying: "badge-yellow",
  complete: "badge-green",
  failed: "badge-red",
};

export function WorkerCard({ worker }: WorkerCardProps) {
  const statusClass = statusColors[worker.status] || "badge-gray";

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-[var(--text-primary)]">
          Worker #{worker.worker_id}
        </span>
        <span className={clsx("badge", statusClass)}>
          {worker.status}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Job</span>
          <span className="text-[var(--text-secondary)] truncate max-w-[150px]">
            {worker.job_title || "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Company</span>
          <span className="text-[var(--text-secondary)]">{worker.company || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Score</span>
          <span className={clsx(
            "font-semibold",
            worker.score >= 7 ? "text-[var(--success)]" :
            worker.score >= 5 ? "text-[var(--warning)]" : "text-[var(--danger)]"
          )}>
            {worker.score ?? "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Elapsed</span>
          <span className="text-[var(--text-secondary)]">{worker.elapsed || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Actions</span>
          <span className="text-[var(--text-secondary)]">{worker.actions ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Last Action</span>
          <span className="text-[var(--text-secondary)] truncate max-w-[120px]">
            {worker.last_action || "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Applied</span>
          <span className="text-[var(--success)]">{worker.jobs_applied ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Failed</span>
          <span className="text-[var(--danger)]">{worker.jobs_failed ?? 0}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-[var(--border)]">
          <span className="text-[var(--text-muted)]">Cost</span>
          <span className="text-[var(--text-primary)] font-mono">
            ${worker.total_cost?.toFixed(4) ?? "0.0000"}
          </span>
        </div>
      </div>
    </div>
  );
}
