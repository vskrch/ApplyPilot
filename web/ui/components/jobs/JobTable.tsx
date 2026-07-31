"use client";

import { useJobStore } from "@/stores/jobs";
import { formatDate, statusBadge, truncate } from "@/lib/utils";
import ScoreBadge from "./ScoreBadge";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function JobTable() {
  const jobs = useJobStore((s) => s.jobs);
  const total = useJobStore((s) => s.total);
  const pages = useJobStore((s) => s.pages);
  const filters = useJobStore((s) => s.filters);
  const loading = useJobStore((s) => s.loading);
  const setFilters = useJobStore((s) => s.setFilters);
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const selectJob = useJobStore((s) => s.selectJob);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePage = (page: number) => {
    setFilters({ page });
    fetchJobs();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[var(--bg-primary)] z-10">
            <tr>
              <th className="table-header text-left p-3 w-16">Score</th>
              <th className="table-header text-left p-3">Title</th>
              <th className="table-header text-left p-3 hidden md:table-cell">Company</th>
              <th className="table-header text-left p-3 hidden lg:table-cell">Location</th>
              <th className="table-header text-left p-3 hidden xl:table-cell">Salary</th>
              <th className="table-header text-left p-3">Stage</th>
              <th className="table-header text-left p-3 hidden sm:table-cell">Applied</th>
              <th className="table-header text-left p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading && jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">
                  No jobs found.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr
                key={job.url}
                className="table-row cursor-pointer"
                onClick={() => selectJob(job.url)}
              >
                <td className="p-3">
                  <ScoreBadge score={job.fit_score} />
                </td>
                <td className="p-3">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {truncate(job.title || "Untitled", 60)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] md:hidden">
                    {job.site || "—"}
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {job.site || "—"}
                  </span>
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {truncate(job.location || "—", 25)}
                  </span>
                </td>
                <td className="p-3 hidden xl:table-cell">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {job.salary || "—"}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`badge ${statusBadge(job.apply_status)}`}>
                    {job.apply_status || "new"}
                  </span>
                </td>
                <td className="p-3 hidden sm:table-cell">
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatDate(job.applied_at)}
                  </span>
                </td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="relative" ref={openMenu === job.url ? menuRef : undefined}>
                    <button
                      className="btn btn-ghost btn-sm p-1"
                      onClick={() => setOpenMenu(openMenu === job.url ? null : job.url)}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === job.url && (
                      <div className="absolute right-0 top-8 z-20 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-36">
                        <button
                          className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          onClick={() => { selectJob(job.url); setOpenMenu(null); }}
                        >
                          View Details
                        </button>
                        <button
                          className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          onClick={() => setOpenMenu(null)}
                        >
                          Mark Applied
                        </button>
                        <button
                          className="w-full text-left px-3 py-1.5 text-sm text-[var(--danger)] hover:bg-[var(--bg-hover)]"
                          onClick={() => setOpenMenu(null)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--text-muted)]">
            {total} jobs · Page {filters.page} of {pages}
          </span>
          <div className="flex gap-1">
            <button
              className="btn btn-ghost btn-sm"
              disabled={filters.page <= 1}
              onClick={() => handlePage(filters.page - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(filters.page - 2, pages - 4));
              const p = start + i;
              if (p > pages) return null;
              return (
                <button
                  key={p}
                  className={`btn btn-sm ${p === filters.page ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => handlePage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn btn-ghost btn-sm"
              disabled={filters.page >= pages}
              onClick={() => handlePage(filters.page + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
