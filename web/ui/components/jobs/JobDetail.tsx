"use client";

import { useJobStore } from "@/stores/jobs";
import { formatDate, formatDateTime, formatDuration, statusBadge } from "@/lib/utils";
import ScoreBadge from "./ScoreBadge";
import { X, ExternalLink, MapPin, Building2, DollarSign } from "lucide-react";

export default function JobDetail() {
  const job = useJobStore((s) => s.selectedJob);
  const clearSelection = useJobStore((s) => s.clearSelection);

  if (!job) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full sm:w-96 lg:w-[480px] bg-[var(--bg-secondary)] border-l border-[var(--border)] shadow-2xl overflow-y-auto">
      <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border)] p-4 flex items-center justify-between z-10">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Job Details</h2>
        <button onClick={clearSelection} className="btn btn-ghost btn-sm p-1">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <ScoreBadge score={job.fit_score} />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug">
              {job.title || "Untitled"}
            </h3>
            <div className="mt-2 space-y-1">
              {job.site && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <Building2 size={12} />
                  {job.site}
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <MapPin size={12} />
                  {job.location}
                </div>
              )}
              {job.salary && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <DollarSign size={12} />
                  {job.salary}
                </div>
              )}
            </div>
          </div>
        </div>

        {job.score_reasoning && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Score Reasoning</h4>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{job.score_reasoning}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-xs text-[var(--text-muted)]">Status</div>
            <span className={`badge mt-1 ${statusBadge(job.apply_status)}`}>
              {job.apply_status || "new"}
            </span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-xs text-[var(--text-muted)]">Discovered</div>
            <div className="text-sm text-[var(--text-primary)] mt-1">{formatDate(job.discovered_at)}</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-xs text-[var(--text-muted)]">Scored</div>
            <div className="text-sm text-[var(--text-primary)] mt-1">{formatDate(job.scored_at)}</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-xs text-[var(--text-muted)]">Tailored</div>
            <div className="text-sm text-[var(--text-primary)] mt-1">{formatDate(job.tailored_at)}</div>
          </div>
        </div>

        {job.apply_attempts != null && job.apply_attempts > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Apply History</h4>
            <div className="space-y-1 text-sm text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Attempts</span>
                <span>{job.apply_attempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Attempt</span>
                <span>{formatDateTime(job.last_attempted_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span>{formatDuration(job.apply_duration_ms)}</span>
              </div>
              {job.apply_error && (
                <div className="mt-2 p-2 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded text-xs text-[var(--danger)]">
                  {job.apply_error}
                </div>
              )}
            </div>
          </div>
        )}

        {job.application_url && (
          <a
            href={job.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost w-full justify-center text-sm"
          >
            <ExternalLink size={14} />
            Open Application
          </a>
        )}
      </div>
    </div>
  );
}
